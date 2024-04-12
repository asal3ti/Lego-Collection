/********************************************************************************
 *  WEB322 – Assignment 05
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Maryam Setayeshnia Student ID: 143893220 Date: 2024-03-29
 *
 ********************************************************************************/


require('dotenv').config();
const Sequelize = require('sequelize');


// set up sequelize to point to our postgres database
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });
// Define Theme model
const Theme = sequelize.define(
  "Theme",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);
// Define Set model
const Set = sequelize.define(
  "Set",
  {
    set_num: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    img_url: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

// Define association
Set.belongsTo(Theme, { foreignKey: 'theme_id' });


/*function initialize() {

  return new Promise((resolve, reject) => {
    setData.forEach((data) => {
      data["theme"] = themeData.find((theme) => theme.id === data.theme_id).name;
      sets.push(data);
    });
    console.log('The "sets" array is filled with objects');
    resolve();
  });
}*/
// new initialize 
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        resolve(); 
      })
      .catch((error) => {
        reject(error); 
      });
  });
}

/*function getAllSets() {
  console.log(`Loading ${sets.length} number of sets`);
  return new Promise((resolve, reject) => {
    resolve(sets);
  });
}*/

//new getAllSets()
function getAllSets() {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [Theme], 
    })
    .then((sets) => {
      resolve(sets); 
    })
    .catch((error) => {
      reject(error); 
    });
  });
}
/*function getSetByNum(setNum) {
  console.log(`Searching in sets by setNum: ${setNum}`);
  let set = sets.find((set) => set.set_num === setNum);
  return new Promise((resolve, reject) => {
    set ? resolve(set) : reject("Unable to find requested set");
  });
}*/
// new getSetByNUm()
function getSetByNum(setNum) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      where: { set_num: setNum },
      include: [Theme], 
    })
    .then((sets) => {
      if (sets.length > 0) {
        resolve(sets[0]); 
      } else {
        reject("Unable to find requested set"); 
      }
    })
    .catch((error) => {
      reject(error); 
    });
  });
}


/*function getSetsByTheme(theme) {
  console.log(`Filtering sets by theme: ${theme}`);
  let themeSets = sets.filter((set) =>
    set.theme.toLowerCase().includes(theme.toLowerCase())
  );
  return new Promise((resolve, reject) => {
    themeSets.length
      ? resolve(themeSets)
      : reject("Unable to find requested sets by theme");
  });
}*/
// new getSetsByTheme(theme)
function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [Theme],
      where: {
        '$Theme.name$': {
          [Sequelize.Op.iLike]: `%${theme}%`
        }
      }
    })
      .then((sets) => {
        if (sets.length > 0) {
          resolve(sets); 
        } else {
          reject("Unable to find requested sets by theme"); 
        }
      })
      .catch((error) => {
        reject(error); 
      });
  });
}
// add a new set to the collection
function addSet(setData) {
  return new Promise((resolve, reject) => {
    Set.create(setData)
      .then(() => {
        resolve(); 
      })
      .catch((error) => {
        reject(error); 
      });
  });
}

// Define the getAllThemes function
function getAllThemes() {
  return new Promise((resolve, reject) => {
    Theme.findAll()
      .then((themes) => {
        resolve(themes); 
      })
      .catch((error) => {
        reject(error); 
      });
  });
}

// edit a set by set_num
function editSet(set_num, setData) {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(() => {
      Set.update(
       setData,
        {
          where: {
            set_num: set_num,
          },
        }
      )
        .then(() => resolve())
        .catch((err) => reject(err.errors[0].message));
    });
  });
}
function deleteSet(set_num) {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(() => {
      Set.destroy(
        {
          where: {
            set_num: set_num,
          },
        }
      )
        .then(() => resolve())
        .catch((err) => reject(err.errors[0].message));
    });
  });
}
module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet };
