# Arras World Records Getter

---

A tool for getting world record holder live stats

---

This tool uses the google sheets api to pull world record holder data from the world records sheet.

To use:

  1. Follow [The quickstart](https://developers.google.com/sheets/api/quickstart/nodejs) until you get a credentials.json file.
  
  2. Place the credentials.json file in the working directory and run the code
  
  3. Follow the instructions that will apear in the console
  
  4. If everything is correct you should see a large object appear with the data in it, you can now add your code at the bottom of the script

Example structure:

    {

      <name>: {
    
        id: <id>,
    
        count: <amount of world records>,
    
        score: <total amount of score>
  
      }

    }