let site = require("./site");
let teamStatusButton = document.getElementById("team-status-run");

async function run() {
    teamStatusButton.disabled = true;
    let org = window.localStorage.getItem("team-status:org");
    let team = window.localStorage.getItem("team-status:team");
    let graphql = site.getGraphQL();

    let response = await graphql(`query teamLookup($org: String!, $team: String!) {
        organization(login: $org) {
          team(slug: $team) {
            members(first: 100) {
              edges {
                node {
                  name
                  login
                  url
                  issues(last: 100, states: OPEN) {
                    totalCount
                  }
                  pullRequests(last: 100, states: OPEN) {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }
    `, {
        org: org,
        team: team
    });
    site.resultsReset();
    site.addResultColumns("Login", "Issues open", "Pull requests open");
    for (let edge of response.data.organization.team.members.edges) {
        let member = edge.node;
        site.addResultRow(
            member.url, [
                member.name,
                member.issues.totalCount,
                member.pullRequests.totalCount
            ]);
    }
    teamStatusButton.disabled = false;
}

teamStatusButton.addEventListener("click", run);