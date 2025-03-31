import fs from "fs-extra";


function saveResults(data) {
  fs.writeFileSync("output/output.json", JSON.stringify(data, null, 2));
  console.log("✅ Results saved to output/output.json");
}

async function saveToJsonFile(data, fileName) {
  const filePath = `output/output.json`
  console.log({fileName});
  
  const newObject = {
    [fileName]: Array.from(data)
  }

  fs.stat(filePath, (err, stats) => {
      if (err || stats.size === 0) {
          // If file doesn't exist or is empty, create a new JSON array
          fs.writeFile(filePath, JSON.stringify([newObject], null, 2), (writeErr) => {
              if (writeErr) console.error("Error creating new JSON file:", writeErr);
              else console.log("File created and object added.");
          });
          return;
      }

      // Open file for reading and writing
      fs.open(filePath, 'r+', (err, fd) => {
          if (err) {
              console.error("Error opening file:", err);
              return;
          }

          fs.readFile(filePath, 'utf8', (readErr, data) => {
              if (readErr) {
                  console.error("Error reading file:", readErr);
                  return;
              }

              // Move cursor before the last closing bracket `]`
              const position = data.lastIndexOf(']');

              if (position === -1) {
                  console.error("Invalid JSON format.");
                  return;
              }

              const updateData = `${position === 1 ? '' : ','}\n  ${JSON.stringify(newObject, null, 2)}\n]`;

              fs.write(fd, updateData, position, 'utf8', (writeErr) => {
                  if (writeErr) console.error("Error writing file:", writeErr);
                  else console.log("Object appended successfully.");
                  fs.close(fd, () => {}); // Close file
              });
          });
      });
  });
}


function saveHtmlToFile(data,) {
  fs.writeFileSync("output/test.html", data);
}

export { saveResults, saveToJsonFile, saveHtmlToFile };
