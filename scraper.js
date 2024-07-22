const puppeteer = require('puppeteer');

async function startBrowser() {
  const browser = await puppeteer.launch({ headless: false }); // Set headless to false for debugging
  const page = await browser.newPage();
  return { browser, page };
}

async function scrapeData(page) {
  const { userInfo, questions, correctAnswersCount, wrongAnswersCount, totalMarks } = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('td.rw'));
    const marksPerQuestion = 2;
    const negativeMark = 0.5;
    let totalMarks = 0;
    let correctAnswersCount = 0;
    let wrongAnswersCount = 0;

    const userInfo = {};
    const mainInfoPanel = document.querySelector('.main-info-pnl');
    if (mainInfoPanel) {
      const infoRows = mainInfoPanel.querySelectorAll('table tr');
      infoRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 2) {
          const key = cells[0].innerText.trim();
          const value = cells[1].innerText.trim();
          userInfo[key] = value;
        }
      });
    }

    const questionData = rows.map(row => {
      const questionTextElement = row.querySelector('td.bold[valign="top"][style="text-align: left;"]');
      const questionImage = questionTextElement && questionTextElement.querySelector('img') ? questionTextElement.querySelector('img').src : null;
      const questionText = questionImage ? '' : (questionTextElement ? questionTextElement.innerText.trim() : '');

      const options = Array.from(row.querySelectorAll('td.wrngAns, td.rightAns')).map(option => {
        const optionText = option.innerText.trim();
        const optionImage = option.querySelectorAll('img')[1] ? option.querySelectorAll('img')[1].src : null;
        return optionImage ? { image: optionImage } : { text: optionText };
      });

      const correctAnswer = row.querySelector('td.rightAns');
      const correctAnswerText = correctAnswer ? correctAnswer.innerText.trim() : null;
      const correctAnswerImage = correctAnswer && correctAnswer.querySelectorAll('img')[1] ? correctAnswer.querySelectorAll('img')[1].src : null;

      const metaDataTable = row.querySelector('.menu-tbl tbody');
      const metaDataRows = metaDataTable ? metaDataTable.querySelectorAll('tr') : [];
      const questionID = metaDataRows[0] ? metaDataRows[0].querySelector('td.bold').innerText.trim() : null;
      const optionIDs = Array.from(metaDataRows).slice(1, 5).map(tr => tr.querySelector('td.bold').innerText.trim());
      const status = metaDataRows[5] ? metaDataRows[5].querySelector('td.bold').innerText.trim() : null;
      const chosenOption = metaDataRows[6] ? metaDataRows[6].querySelector('td.bold').innerText.trim() : null;

      const normalize = str => str ? str.replace(/[^\d]/g, '') : '';
      const normalizedCorrectAnswer = normalize(correctAnswerText);
      const normalizedChosenOption = normalize(chosenOption);

      const correctOptionIndex = options.findIndex(option => {
        if (correctAnswerText) {
          return normalize(option.text) === normalizedCorrectAnswer;
        } else if (correctAnswerImage) {
          return option.image === correctAnswerImage;
        }
        return false;
      });

      return {
        question: questionText,
        questionImage: questionImage,
        options: options,
        correctAns: correctAnswerText || correctAnswerImage,
        questionID: questionID,
        optionIDs: optionIDs,
        status: status,
        chosenOption: chosenOption,
        correctOptionNumber: correctOptionIndex + 1
      };
    }).filter(item => item.question || item.options.length > 0);

    return {
      userInfo: userInfo,
      questions: questionData,
      correctAnswersCount: correctAnswersCount,
      wrongAnswersCount: wrongAnswersCount,
      totalMarks: totalMarks
    };
  });

  return {
    userInfo,
    questions,
    correctAnswersCount,
    wrongAnswersCount,
    totalMarks
  };
}

module.exports = { startBrowser, scrapeData };
