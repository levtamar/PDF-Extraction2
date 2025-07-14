
const input = document.getElementById("pdf-upload");
const output = document.getElementById("output");

input.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file || file.type !== "application/pdf") {
    alert("נא להעלות קובץ PDF תקין");
    return;
  }

  const fileReader = new FileReader();
  fileReader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    output.textContent = ""; // איפוס הפלט

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const matrix = createMatrixFromItems(content.items);
      matrix.reverse();

      output.textContent += `\n--- עמוד ${i} ---\n`;

      // for (let row = 0; row < matrix.length; row++) {
      //   const rowCells = matrix[row];

      //   const hebrewRow = rowCells.flat().some(item => /[\u0590-\u05FF]/.test(item.str));
      //   const columns = hebrewRow ? [...rowCells].reverse() : rowCells;

      //   for (let col = 0; col < columns.length; col++) {
      //     const cellItems = columns[col];
      //     for (const item of cellItems) {
      //       output.textContent += item.str + " ";
      //     }
      //   }

      //   output.textContent += "\n";
      // }
//       const text = extractTextByColumnsOrder(matrix);
// output.textContent += text + "\n";

const result = extractTextByColumnsOrder(matrix);
if (result.isTwoColumn) {
  output.textContent += "[!] Two-column layout detected\n";
}
output.textContent += result.text + "\n";

    }
  };

  fileReader.readAsArrayBuffer(file);
});

// קביעת גודל תא
const cellWidth = 50;
const cellHeight = 20;

function createMatrixFromItems(items) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const item of items) {
    const x = item.transform[4];
    const y = item.transform[5];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const cols = Math.ceil((maxX - minX) / cellWidth) + 1;
  const rows = Math.ceil((maxY - minY) / cellHeight) + 1;

  const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => []));

  for (const item of items) {
    const x = item.transform[4];
    const y = item.transform[5];

    const colIndex = Math.floor((x - minX) / cellWidth);
    const rowIndex = Math.floor((y - minY) / cellHeight);

    matrix[rowIndex][colIndex].push(item);
  }

  return matrix;
}
const downloadBtn = document.getElementById("download-txt");

// הפעלת הכפתור רק אחרי שיש טקסט בפלט
input.addEventListener("change", () => {
  downloadBtn.disabled = true; // ננעל בהתחלה
});

input.addEventListener("change", async (event) => {
  // ... הקוד הקיים להעלאת הקובץ ...
  // בסוף של טיפול הקובץ לאחר שהטקסט מלא:
  downloadBtn.disabled = false; // מאפשר הורדה אחרי טעינה מוצלחת
});

// טיפול בלחיצה על כפתור ההורדה
downloadBtn.addEventListener("click", () => {
  const text = output.textContent;
  if (!text) {
    alert("אין טקסט להורדה");
    return;
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "extracted_text.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
// function extractTextByColumnsOrder(matrix, minGapCols = 2, emptyRatio = 0.8) {
//   const rows = matrix.length;
//   const cols = matrix[0].length;

//   // שלב 1: מחשבים כמה תאים ריקים בכל עמודה
//   const emptyCounts = new Array(cols).fill(0);
//   for (let row = 0; row < rows; row++) {
//     for (let col = 0; col < cols; col++) {
//       const cell = matrix[row][col];
//       if (!cell || cell.length === 0) emptyCounts[col]++;
//     }
//   }

//   // שלב 2: מחפשים רצף עמודות ריקות שמהוות הפרדה בין טורים
//   let separatorCol = null;
//   for (let i = 0; i < cols - minGapCols; i++) {
//     let isGap = true;
//     for (let j = 0; j < minGapCols; j++) {
//       if (emptyCounts[i + j] / rows < emptyRatio) {
//         isGap = false;
//         break;
//       }
//     }
//     if (isGap) {
//       separatorCol = i + Math.floor(minGapCols / 2);
//       break;
//     }
//   }

//   if (separatorCol === null) {
//     // אין הפרדה ברורה – מחזיר לפי שורות רגילות
//     return matrix.flat().flat().map(item => item.str).join(" ");
//   }

//   // שלב 3: קוראים טור ימין לפי שורות
//   let text = "";
//   for (let row = 0; row < rows; row++) {
//     for (let col = 0; col < separatorCol; col++) {
//       const cell = matrix[row][col];
//       if (cell && cell.length) {
//         for (const item of cell) text += item.str + " ";
//       }
//     }
//   }

//   // שלב 4: אחר כך טור שמאל לפי שורות
//   for (let row = 0; row < rows; row++) {
//     for (let col = separatorCol + minGapCols; col < cols; col++) {
//       const cell = matrix[row][col];
//       if (cell && cell.length) {
//         for (const item of cell) text += item.str + " ";
//       }
//     }
//   }

//   return text;
// }
function extractTextByColumnsOrder(matrix, minGapCols = 2, emptyRatio = 0.8) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  const emptyCounts = new Array(cols).fill(0);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = matrix[row][col];
      if (!cell || cell.length === 0) emptyCounts[col]++;
    }
  }

  let separatorCol = null;
  for (let i = 0; i < cols - minGapCols; i++) {
    let isGap = true;
    for (let j = 0; j < minGapCols; j++) {
      if (emptyCounts[i + j] / rows < emptyRatio) {
        isGap = false;
        break;
      }
    }
    if (isGap) {
      separatorCol = i + Math.floor(minGapCols / 2);
      break;
    }
  }

  let text = "";
  if (separatorCol === null) {
    text = matrix.flat().flat().map(item => item.str).join(" ");
    return { text, isTwoColumn: false };
  }

  // // קודם טור ימין (מימין למחיצה)
  // for (let row = 0; row < rows; row++) {
  //   for (let col = 0; col < separatorCol; col++) {
  //     const cell = matrix[row][col];
  //     if (cell && cell.length) {
  //       for (const item of cell) {
  //         text += item.str + " ";
  //       }
  //     }
  //   }
  //   text += "\n";
  // }

  // // אחר כך טור שמאל (משמאל למחיצה)
  // for (let row = 0; row < rows; row++) {
  //   for (let col = separatorCol + minGapCols; col < cols; col++) {
  //     const cell = matrix[row][col];
  //     if (cell && cell.length) {
  //       for (const item of cell) {
  //         text += item.str + " ";
  //       }
  //     }
  //   }
  //   text += "\n";
  // }
// קודם טור שמאל (משמאל למחיצה)
for (let row = 0; row < rows; row++) {
  for (let col = separatorCol + minGapCols; col < cols; col++) {
    const cell = matrix[row][col];
    if (cell && cell.length) {
      for (const item of cell) {
        text += item.str + " ";
      }
    }
  }
  text += "\n";
}

// אחר כך טור ימין (מימין למחיצה)
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < separatorCol; col++) {
    const cell = matrix[row][col];
    if (cell && cell.length) {
      for (const item of cell) {
        text += item.str + " ";
      }
    }
  }
  text += "\n";
}

  return { text, isTwoColumn: true };
}
