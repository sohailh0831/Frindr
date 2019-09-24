import 'babel-polyfill';
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';
// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Profile",  () => {
    describe("/profile", () => {
        describe("POST", () => {
            it('It should return 400 when missing email', (done) =>{
                chai.request('http://localhost:3000')
                    .post('/profile')
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.body.should.be.a('object');
                        res.body.error.should.eql(true)
                        done();
                });
            });
            it('It should return 201 when missing anything other than email', (done) =>{
                chai.request('http://localhost:3000')
                        .post('/profile')
                        .send({
                            "email": "test@gmail.com",
                            })
                        .end((err, res) => {
                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(false)
                            res.body.message.affectedRows.should.eql(1);
                            done();
                    });
            });
            it('It should return 400 when the email is taken', (done) =>{
                chai.request('http://localhost:3000')
                        .post('/profile')
                        .send({
                            "email": "test@gmail.com",
                            })
                        .end((err, res) => {
                            res.should.have.status(400);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(true)
                            done();
                    });
            });
            it('It should return 201 when everything is included', (done) =>{
                chai.request('http://localhost:3000')
                        .post('/profile')
                        .send({
                            "email": "test1@gmail.com",
                            "name": "yo",
                            "bio": "yo",
                            "interests": {"cool": "cool"},
                            "characteristics": {"cool": "cool"}
                            })
                        .end((err, res) => {
                            res.should.have.status(201);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(false)
                            res.body.message.affectedRows.should.eql(1);
                            done();
                    });
            });
        });
        
        describe("GET", () => {
            it('It should return 400 when nothing is included', (done) =>{
                chai.request('http://localhost:3000')
                        .delete('/profile')
                        .end((err, res) => {
                            res.should.have.status(400);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(true)
                            done();
                    });
            });
            it('It should return 200', (done) =>{
                chai.request('http://localhost:3000')
                        .get('/profile')
                        .send({
                            "email": "test@gmail.com",
                            })
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(false)
                            res.body.message[0].email.should.eql("test@gmail.com");
                            done();
                    });
            });
        });
        describe("DELETE", () => {
            it('It should return 400 when nothing is included', (done) =>{
                chai.request('http://localhost:3000')
                        .delete('/profile')
                        .end((err, res) => {
                            res.should.have.status(400);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(true)
                            done();
                    });
            });
            it('It should return 200', (done) =>{
                chai.request('http://localhost:3000')
                        .delete('/profile')
                        .send({
                            "email": "test@gmail.com",
                            })
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(false)
                            res.body.message.affectedRows.should.eql(1);
                            done();
                    });
            });
            it('It should return 200', (done) =>{
                chai.request('http://localhost:3000')
                        .delete('/profile')
                        .send({
                            "email": "test1@gmail.com",
                            })
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(false)
                            res.body.message.affectedRows.should.eql(1);
                            done();
                    });
            });
            it('It should return 400', (done) =>{
                chai.request('http://localhost:3000')
                        .delete('/profile')
                        .send({
                            "email": "test1@gmail.com",
                            })
                        .end((err, res) => {
                            res.should.have.status(400);
                            res.body.should.be.a('object');
                            res.body.error.should.eql(true)
                            done();
                    });
            });
        });
    });
    describe("/name", () => {
        describe("PATCH", () => {
            
        });
    });
    describe("/bio", () => {
        describe("PATCH", () => {
            
        });
    });
    describe("/interests", () => {
        describe("PATCH", () => {
            
        });
    });
    describe("/characteristics", () => {
        describe("PATCH", () => {
            
        });
    });
});