'use strict';

const chai = require('chai');
const execa = require('execa');

const expect = chai.expect;


describe('exitHook', () => {
  context('main', () => {
    it('main', async () => {
      const { stdout } = await execa(process.execPath, ['exit-hook-fixture.js']);
      expect(stdout).to.equal('before\nafter');
    });
  });
});
