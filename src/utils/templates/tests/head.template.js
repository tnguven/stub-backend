import { getHeaders, arrayToJson, buildUrl, getStatus } from "../../utils.cli";
import { libraries } from "../common.template";

export const headTestTemplate = (args, idsFormatted) => {
  let path = args._[2];
  const pathWithDummyData = buildUrl(path, idsFormatted);
  const headers = getHeaders(args);
  const status = getStatus(args);
  return libraries() + `
describe('GET - ${path} ', () => {
  it('should exist', (done) => {
    request(app)
      .head('${path.startsWith('/') ? pathWithDummyData : `/${pathWithDummyData}`}')
      ${headers ? `.set({${arrayToJson(headers)}})` : ''}
      .end((err, res) => {
        expect(err).to.not.exist;
          expect(res.status).to.equal(${status ? status : '200'});
          expect(res.body).to.be.empty;
          done();
      });
  });
});
`;
}
