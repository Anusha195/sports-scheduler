'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      // A session belongs to a sport
      Session.belongsTo(models.Sport, {
        foreignKey: 'sportId',
        as: 'sport',
      });

      // A session is created by a user (player/admin)
      Session.belongsTo(models.user, {
        foreignKey: 'createdBy',
        as: 'creator',
      });
    }
  }
  Session.init(
    {
      sportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      team1Players: DataTypes.STRING, // Store as comma-separated values
      team2Players: DataTypes.STRING,
      additionalPlayers: DataTypes.INTEGER,
      dateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      venue: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active', // 'active', 'cancelled'
      },
      cancelReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Session',
    }
  );
  return Session;
};
