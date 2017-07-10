import { QuantidevWebappPage } from './app.po';

describe('quantidev-webapp App', () => {
  let page: QuantidevWebappPage;

  beforeEach(() => {
    page = new QuantidevWebappPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
