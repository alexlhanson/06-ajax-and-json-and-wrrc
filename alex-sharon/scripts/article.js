'use strict';

function Article(rawDataObj) {
  this.author = rawDataObj.author;
  this.authorUrl = rawDataObj.authorUrl;
  this.title = rawDataObj.title;
  this.category = rawDataObj.category;
  this.body = rawDataObj.body;
  this.publishedOn = rawDataObj.publishedOn;
}

// REVIEW: Instead of a global `articles = []` array, let's attach this list of all articles directly to the constructor function. Note: it is NOT on the prototype. In JavaScript, functions are themselves objects, which means we can add properties/values to them at any time. In this case, the array relates to ALL of the Article objects, so it does not belong on the prototype, as that would only be relevant to a single instantiated Article.
Article.all = [];

// COMMENT: Why isn't this method written as an arrow function?
// Its a prototype and will lose its contextual this.
Article.prototype.toHtml = function () {
  let template = Handlebars.compile($('#article-template').text());

  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn)) / 60 / 60 / 24 / 1000);

  // COMMENT: What is going on in the line below? What do the question mark and colon represent? How have we seen this same logic represented previously?
  // Not sure? Check the docs!
  // It is using a ternery operator and the question mark is a conditional check to see if this.published is defined (true). The colon represents the else of the conditional.  if (something){foo}else{bar}
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';
  this.body = marked(this.body);

  return template(this);
};

// REVIEW: There are some other functions that also relate to all articles across the board, rather than just single instances. Object-oriented programming would call these "class-level" functions, that are relevant to the entire "class" of objects that are Articles.

// REVIEW: This function will take the rawData, how ever it is provided, and use it to instantiate all the articles. This code is moved from elsewhere, and encapsulated in a simply-named function for clarity.

// COMMENT: Where is this function called? What does 'rawData' represent now? How is this different from previous labs?
// Rather than looking for the data to use for fetchAll in a js file it is being called from local storage to simulate talking to a database.
Article.loadAll = articleData => {
  articleData.sort((a, b) => (new Date(b.publishedOn)) - (new Date(a.publishedOn)))

  articleData.forEach(articleObject => Article.all.push(new Article(articleObject)))
}

// TODO: This function will retrieve the data from either a local or remote source, and process it, then hand off control to the View.
Article.fetchAll = () => {
  // REVIEW: What is this 'if' statement checking for? Where was the rawData set to local storage? it is set in the else statement below.
  let dataPath = '../data/hackerIpsum.json';

  let articleData = JSON.parse(localStorage.rawData);
  let jqXHR = $.ajax({
    type: 'HEAD',
    url: dataPath,

    success: function (result) {
      var headers = jqXHR.getAllResponseHeaders();
      var etagArray = headers.trim().split(/[\r\n]+/);
      let etag = etagArray.filter(x => x.includes('etag'));
      console.log(etag);
      let checkEtag = function (result) {
        if (localStorage.etag !== etag) {
          let setLocalStore = function (rawData) {
            localStorage.rawData = JSON.stringify(rawData);
          };
          $.getJSON(dataPath, setLocalStore);
          localStorage.etag = etag;
        }
      }
      localStorage.etag ? checkEtag() : localStorage.etag = etag;
    }
  });
  if (localStorage.rawData) {
    Article.loadAll(articleData);
    articleView.initIndexPage();
  } else {
    let setLocalStore = function (rawData) {
      localStorage.rawData = JSON.stringify(rawData);
      Article.loadAll(rawData);
      articleView.initIndexPage();
    };

    $.getJSON(dataPath, setLocalStore);
  }
}