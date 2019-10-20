import 'babel-polyfill';
import chai from 'chai';
import chaiHttp from 'chai-http';
import {
    postProfile,
    patchInterests,
    deleteProfile
} from "../functions/profile";
import {
    getMatches
} from "../functions/matching";
import { getMaxListeners } from 'cluster';
// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Matching", () => {
    it('It should add a row to the database', async () =>{
        let req = { body: {email: "test1@gmail.com"}}
        let result = await postProfile(req);
        result.should.be.a('object');
        result.error.should.eql(false)
        result.message.message.affectedRows.should.eql(1);
    });
    it('It should add a row to the database', async () =>{
        let req = { body: {email: "test2@gmail.com"}}
        let result = await postProfile(req);
        result.should.be.a('object');
        result.error.should.eql(false)
        result.message.message.affectedRows.should.eql(1);
    });
    it('It should add a row to the database', async () =>{
        let req = { body: {email: "test3@gmail.com"}}
        let result = await postProfile(req);
        result.should.be.a('object');
        result.error.should.eql(false)
        result.message.message.affectedRows.should.eql(1);
    });
    it('It should update the database', async () =>{     
        let req = { user: {
            email: "test1@gmail.com"},
            body: { param: 'reading' }                
        }
        let result = await patchInterests(req);
        result.should.be.a('object');
        result.error.should.eql(false)
    });
    it('It should update the database', async () =>{     
        let req = { user: {
            email: "test2@gmail.com"},
            body: { param: 'reading' }                
        }
        let result = await patchInterests(req);
        result.should.be.a('object');
        result.error.should.eql(false)
    });
    it('It should update the database', async () =>{     
        let req = { user: {
            email: "test3@gmail.com"},
            body: { param: '' }                
        }
        let result = await patchInterests(req);
        result.should.be.a('object');
        result.error.should.eql(false)
    });
    it('Should get matches in the correct order', async () =>{     
        let req = { body: {
            email: "test1@gmail.com"},
            user: {
                email: "test1@gmail.com"}            
        }
        let result = await getMatches(req);
        console.log(result)
        result.should.be.a('object');
        result.message.should.eql('test2@gmail.com');
        result.count.should.eql(1);
    });
    it('It should delete from db', async () =>{
        let req = {user: {email: "test1@gmail.com"}};
        let result = await deleteProfile(req);
        result.should.be.a('object');
        result.error.should.eql(false)
        result.message.message.affectedRows.should.eql(1);
    });it('It should delete from db', async () =>{
        let req = {user: {email: "test2@gmail.com"}};
        let result = await deleteProfile(req);
        result.should.be.a('object');
        result.error.should.eql(false)
        result.message.message.affectedRows.should.eql(1);
    });it('It should delete from db', async () =>{
        let req = {user: {email: "test3@gmail.com"}};
        let result = await deleteProfile(req);
        result.should.be.a('object');
        result.error.should.eql(false)
        result.message.message.affectedRows.should.eql(1);
    });

});