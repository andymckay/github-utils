async function run() {
    let graphql = require("@octokit/graphql");
    let pat = process.env.GITHUB_SCRIPT_TOKEN;
    let client = graphql.defaults({
        headers: {
            authorization: `token ${pat}`
        }
    });
    let res = await client(`
    query {
      repository(name: "pe-actions-experience", owner: "github") {
        issues(last: 100, states: OPEN) {
          nodes {
            id
            number
            projectCards {
              edges {
                node {
                  id
                  project {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
    `);
    let projectId = "MDc6UHJvamVjdDMzNDc1NDM=";

    for (let row of res.data.repository.issues.nodes) {
        let hasProjects = false;
        for (let edge of row.projectCards.edges) {
          hasProjects = true;
        }
        if (!hasProjects) {
            console.log(`Adding to the project board ${row.number}.`);
            let res = await client(`
            mutation {
              updateIssue(input: {
                  id: "${row.id}",
                  projectIds: ["${projectId}"]
              }) {
                clientMutationId
              }
            }
            `);
        }
    }
}

run();
