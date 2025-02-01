const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('./app');
const { User, Sport, Session } = require('./models');

// Helper function to hash passwords
const hashPassword = async (password) => {
  const hashedPwd = await bcrypt.hash(password, 10);
  return hashedPwd;
};

describe('Sports Scheduler Application Tests', () => {
  let server, agent;

  beforeAll(async () => {
    await User.sync({ force: true });
    await Sport.sync({ force: true });
    await Session.sync({ force: true });
    server = app.listen(4000);
    agent = request.agent(server);
  });

  afterAll(async () => {
    await server.close();
    await User.sequelize.close();
    await Sport.sequelize.close();
    await Session.sequelize.close();
  });

  beforeEach(async () => {
    await agent.get('/logout');
  });

  test('Admin Signup and Login', async () => {
    const resSignup = await agent.post('/create-player').send({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: await hashPassword('adminpassword'),
      role: 'admin',
    });

    expect(resSignup.statusCode).toBe(200);
    const resLogin = await agent.post('/signinsubmit').send({
      email: 'admin@test.com',
      password: 'adminpassword',
    });

    expect(resLogin.statusCode).toBe(302);
    expect(resLogin.headers.location).toBe('/admindashboard');
  });

  test('Player Signup and Login', async () => {
    const resSignup = await agent.post('/create-player').send({
      firstName: 'Player',
      lastName: 'User',
      email: 'player@test.com',
      password: await hashPassword('playerpassword'),
      role: 'player',
    });

    expect(resSignup.statusCode).toBe(200);

    const resLogin = await agent.post('/signinsubmit').send({
      email: 'player@test.com',
      password: 'playerpassword',
    });

    expect(resLogin.statusCode).toBe(302);
    expect(resLogin.headers.location).toBe('/playerdashboard');
  });

  test('Admin Create Sport', async () => {
    await agent.post('/signinsubmit').send({
      email: 'admin@test.com',
      password: 'adminpassword',
    });

    const resCreateSport = await agent.post('/create-sport').send({
      sportName: 'Test Sport',
    });

    expect(resCreateSport.statusCode).toBe(302);
    expect(resCreateSport.headers.location).toBe('/admindashboard');

    const sports = await Sport.findAll();
    expect(sports.length).toBe(1);
    expect(sports[0].name).toBe('Test Sport');
  });

  test('Player Join Session', async () => {
    await agent.post('/signinsubmit').send({
      email: 'player@test.com',
      password: 'playerpassword',
    });

    const sport = await Sport.create({
      name: 'Test Sport',
      createdBy: 1,
    });

    const resCreateSession = await agent.post('/create-session').send({
      sportId: sport.id,
      dateTime: '2024-06-30 14:00',
      venue: 'Test Venue',
      team1Players: '1',
      team2Players: '',
    });

    const session = await Session.findOne({ where: { sportId: sport.id } });
    
    const resJoinSession = await agent.post(`/join-session/${session.id}`);

    expect(resJoinSession.statusCode).toBe(302);
    expect(resJoinSession.headers.location).toBe('/playerdashboard');

    const updatedSession = await Session.findByPk(session.id);
    const team1 = updatedSession.team1Players.split(',').map(Number);
    expect(team1.includes(1)).toBe(true); 
  });

  test('Player Cancel Session', async () => {
    await agent.post('/signinsubmit').send({
      email: 'player@test.com',
      password: 'playerpassword',
    });

    const sport = await Sport.create({
      name: 'Test Sport',
      createdBy: 1,
    });

    const resCreateSession = await agent.post('/create-session').send({
      sportId: sport.id,
      dateTime: '2024-06-30 14:00',
      venue: 'Test Venue',
      team1Players: '1',
      team2Players: '',
    });

    const session = await Session.findOne({ where: { sportId: sport.id } });

    await agent.post(`/join-session/${session.id}`);

    const resCancelSession = await agent.post(`/cancel-session/${session.id}`).send({
      reason: 'Not available',
    });

    expect(resCancelSession.statusCode).toBe(302);
    expect(resCancelSession.headers.location).toBe('/playerdashboard');

    const updatedSession = await Session.findByPk(session.id);
    const team1 = updatedSession.team1Players.split(',').map(Number);
    expect(team1.includes(1)).toBe(false);
  });

  test('Logout', async () => {
    await agent.post('/signinsubmit').send({
      email: 'admin@test.com',
      password: 'adminpassword',
    });

    const resLogout = await agent.get('/logout');

    expect(resLogout.statusCode).toBe(302);
    expect(resLogout.headers.location).toBe('/');
  });
});
