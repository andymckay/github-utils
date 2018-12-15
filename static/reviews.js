let reviewsRunButton = document.getElementById('reviews-count-run');

async function run() {
    reviewsRunButton.disabled = true;
    let org = window.localStorage.getItem('reviews-count:org');
    let repo = window.localStorage.getItem('reviews-count:repo');

    let octokit = getOctoKit();

    let pulls = await octokit.pulls.list({
        owner: org,
        repo: repo
    })

    resultsReset();
    addResultColumns('Review', 'Reviews requested', 'Reviews completed');
    for (let pull of pulls.data) {
        let requested_reviewers = pull.requested_reviewers.length;
        let reviews = await octokit.pulls.listReviews({
            owner: org,
            repo: repo,
            number: pull.number
        })

        let reviews_completed = 0;
        for (let review of reviews.data) {
            if (['APPROVED', 'CHANGES_REQUESTED'].includes(review.state)) {
                requested_reviewers += 1;
                reviews_completed += 1;
            }
        }
        addResultRow(
            pull.html_url, [`${pull.number}: ${pull.title}`, requested_reviewers, reviews_completed]
        );
    }
    reviewsRunButton.disabled = false;
};

reviewsRunButton.addEventListener("click", run);