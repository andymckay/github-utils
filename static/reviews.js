let moment = require("moment");
let site = require("./site");
let reviewsRunButton = document.getElementById("reviews-count-run");

async function run() {
    reviewsRunButton.disabled = true;
    let org = window.localStorage.getItem("reviews-count:org");
    let repo = window.localStorage.getItem("reviews-count:repo");

    let graphql = await site.getGraphQL();

    let response = await graphql(`
    query lookupMarkeptlaceListings {
      organization(login: "github-interviews") {
        repositories(last: 100) {
          edges {
            node {
              nameWithOwner
              collaborators(last: 100) {
                nodes {
                  login
                }
              }
            }
          }
        }
      }
    }
    `, {
        org: org,
        repo: repo
    });

    console.log('----');
    for (let repo of response.data.organization.repositories.edges) {
      console.log(repo.node);
      console.log(repo.node.nameWithOwner);
      console.log(repo.node.collaborators)
    }


    reviewsRunButton.disabled = false;
}

reviewsRunButton.addEventListener("click", run);