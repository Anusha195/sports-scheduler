const app = require('./app');
const db = require('./models');


const PORT = process.env.PORT || 4000;


db.sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('Database synchronized successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to synchronize the database:', error);
  });
