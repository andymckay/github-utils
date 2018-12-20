let site = require("./site");
let reviewsRunButton = document.getElementById('reviews-count-run');

async function run() {
    reviewsRunButton.disabled = true;
    let org = window.localStorage.getItem('reviews-count:org');
    let repo = window.localStorage.getItem('reviews-count:repo');

    let graphql = await site.getGraphQL();

    let response = await graphql(`query reviewsLookup($org: String!, $repo: String!) {
        repository(owner: $org, name:$repo) {
          pullRequests(last:20, states:OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
            edges {
              node {
                title
                url
                number
                createdAt
                reviewRequests(first: 20) {
                  edges {
                    node {
                      id
                    }
                  }
                }
                reviews(first:50) {
                  edges {
                    node {
                      id
                      state
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
        repo: repo
    })

    site.resultsReset();
    site.addResultColumns('Review', 'Reviews requested', 'Reviews completed', 'Created at');

    for (let pullRequest of response.data.repository.pullRequests.edges) {
        let requested_reviewers = pullRequest.node.reviewRequests.edges.length;
        let reviews_completed = 0;
        for (let review of pullRequest.node.reviews.edges) {
            if (['APPROVED', 'CHANGES_REQUESTED'].includes(review.node.state)) {
                requested_reviewers += 1;
                reviews_completed += 1;
            }
        }
        site.addResultRow(
            pullRequest.node.url, [`${pullRequest.node.number}: ${pullRequest.node.title}`,
                requested_reviewers,
                reviews_completed,
                moment(pullRequest.node.createdAt).format('ll')
            ]
        );
    }
    reviewsRunButton.disabled = false;
};

reviewsRunButton.addEventListener("click", run);