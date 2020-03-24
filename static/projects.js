let moment = require("moment");
let site = require("./site");
let projectRunButton = document.getElementById("project-update-run");

async function run() {
    projectRunButton.disabled = true;
    let project_id = window.localStorage.getItem("project-update:id");
    let org = window.localStorage.getItem("project-update:org");

    let graphql = site.getGraphQL();

    let response = await graphql(`query projectLookup($org: String!, $project_id: Int!) {
        organization(login: $org) {
          project(number: $project_id) {
            columns(first: 100) {
              nodes {
                name
                cards(first: 100) {
                  nodes {
                    id
                    content {
                      __typename
                      ... on Issue {
                        title
                        url
                        updatedAt
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, {
        org: org,
        project_id: parseInt(project_id)
    });
    site.resultsReset();
    site.addResultColumns("Card", "Column", "Last updated");
    let ordered = [];
    for (let column of response.data.organization.project.columns.nodes) {
        for (let card of column.cards.nodes) {
            let issue = card.content;
            if (!issue || issue.__typename != "Issue") {
                continue;
            }
            ordered.push([issue.updatedAt, issue, column]);
        }
    }

    ordered.sort(function(a, b) { return a[0] > b[0]; });
    for (let result of ordered) {
      let issue = result[1];
      let column = result[2];
      site.addResultRow(
        issue.url, [
          issue.title,
          column.name,
          moment(issue.updatedAt).fromNow()
      ]);
    };
    projectRunButton.disabled = false;
}

projectRunButton.addEventListener("click", run);