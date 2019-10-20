import 'babel-polyfill';
import chai from 'chai';
import chaiHttp from 'chai-http';
import {
    postProfile,
    getProfile,
    patchBio,
    patchCharacteristics,
    patchInterests,
    patchName,
    deleteProfile
    
} from "../functions/profile";
import { getMaxListeners } from 'cluster';
// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Profile",  async () => {
    await describe("/profile", async () => {
        await describe("POST", () => {
            it('It should return an error', async () =>{
                let req = { body: {}}
                let result = await postProfile(req);
                result.should.be.a('object');
                result.error.should.eql(true);
            });
            it('It should add a row to the database', async () =>{
                let req = { body: {email: "test@gmail.com"}}
                let result = await postProfile(req);
                result.should.be.a('object');
                result.error.should.eql(false)
                result.message.message.affectedRows.should.eql(1);
            });
            it('It should return 400 when the email is taken', async () =>{
                let req = { body: {email: "test@gmail.com"}}
                let result = await postProfile(req);
                result.should.be.a('object');
                result.error.should.eql(true)
            });
           
            it('It should add a row to the database', async () =>{
                let req = { body: {
                    email: "test1@gmail.com",
                    name: "yo",
                    bio: "yo",
                    }}
                let result = await postProfile(req);
                console.log(result)
                result.should.be.a('object')
                result.error.should.eql(false)
                result.message.message.affectedRows.should.eql(1);
                
            });
        });
        
        describe("GET", () => {
            it('It should return an error', async () =>{
                let result = await getProfile();
                result.should.be.a('error');
            });
            it('It should return a profile', async () =>{
                let result = await getProfile("test@gmail.com");
                result.should.be.a('object');
                result.error.should.eql(false)
                result.message.message.email.should.eql("test@gmail.com");
            });
        });
    });

    describe("/name", () => {
        describe("PATCH", () => {
            it('It should return an error without name', async () =>{  
                let req = { user: {
                    email: "test1@gmail.com"                   
                }}
                let result = await patchName(req);
                result.should.be.a('object');
                result.error.should.eql(true);
            });
            it('It should return 200', async () =>{     
                let req = { user: {
                    email: "test1@gmail.com"},
                    body: {name: "updated"}                
                };
                let result = await patchName(req);
                result.should.be.a('object');
                result.error.should.eql(false)
            });
        it('It should return 200 and the new name should be there', async () =>{
            let result = await getProfile("test1@gmail.com")
            result.should.be.a('object');
            result.error.should.eql(false)
            result.message.message.name.should.eql("updated");
            });
        });
    });

    describe("/bio", () => {
        describe("PATCH", () => {
            it('It should return an error without bio', async () =>{  
                let req = { user: {
                    email: "test1@gmail.com"                   
                }}
                let result = await patchBio(req);
                result.should.be.a('object');
                result.error.should.eql(true);
            });
            it('It should return 200', async () =>{     
                let req = { user: {
                    email: "test1@gmail.com"},
                    body: {bio: "updated"}                
                };
                let result = await patchBio(req);
                result.should.be.a('object');
                result.error.should.eql(false)
            });
        it('It should return 200 and the new bio should be there', async () =>{
            let result = await getProfile("test1@gmail.com")
            result.should.be.a('object');
            result.error.should.eql(false)
            result.message.message.bio.should.eql("updated");
            });
        });
    });

    describe("/interests", () => {
        describe("PATCH", () => {
            it('It should return an error without interests', async () =>{  
                let req = { user: {
                    email: "test1@gmail.com"                   
                }}
                let result = await patchInterests(req);
                result.should.be.a('object');
                result.error.should.eql(true);
            });
            it('It should update the database', async () =>{     
                let req = { user: {
                    email: "test1@gmail.com"},
                    body: { param: 'updated' }                
                }
                let result = await patchInterests(req);
                result.should.be.a('object');
                result.error.should.eql(false)
            });
        it('It should return a profile and the new interests should be there', async () =>{
            let result = await getProfile("test1@gmail.com")
            result.should.be.a('object');
            result.error.should.eql(false)
            result.message.message.interests.should.eql(['updated']);
            });
        });
    });
    

    describe("/characteristics", () => {
        describe("PATCH", () => {
            it('It should return an error without characteristics', async () =>{  
                let req = { user: {
                    email: "test1@gmail.com"                   
                }}
                let result = await patchCharacteristics(req);
                result.should.be.a('object');
                result.error.should.eql(true);
            });
            it('It should update the database', async () =>{     
                let req = { user: {
                    email: "test1@gmail.com"},
                    body: "updated"                 
                }
                let result = await patchCharacteristics(req);
                result.should.be.a('object');
                result.error.should.eql(false)
            });
        it('It should return a profile and the new characteristics should be there', async () =>{
            let result = await getProfile("test1@gmail.com")
            result.should.be.a('object');
            result.error.should.eql(false)
            result.message.message.characteristics.should.eql("updated");
            });
        });
    });

    describe("DELETE", () => {
        it('It should return an error when nothing is included', async () =>{
            let req = {};
            let result = await deleteProfile(req);
            result.should.be.a('error');
        });
        it('It should delete from db', async () =>{
            let req = {user: {email: "test@gmail.com"}};
            let result = await deleteProfile(req);
            result.should.be.a('object');
            result.error.should.eql(false)
            result.message.message.affectedRows.should.eql(1);
        });
        it('It should delete from db', async () =>{
            let req = {user: {email: "test1@gmail.com"}};
            let result = await deleteProfile(req);
            result.should.be.a('object');
            result.error.should.eql(false)
            result.message.message.affectedRows.should.eql(1);
        });
        it('It should return an error if already deleted', async () =>{
            let req = {user: {email: "test1@gmail.com"}};
            let result = await deleteProfile(req);
            result.should.be.a('object');
            result.error.should.eql(true); 
        });
    });
});
