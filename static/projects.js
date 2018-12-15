let projectRunButton = document.getElementById('project-update-run');

async function run() {
    projectRunButton.disabled = true;
    let project_id = window.localStorage.getItem('project-update:id');

    let octokit = getOctoKit();

    let columns = await octokit.projects.listColumns({ project_id })

    resultsReset();
    addResultColumns('Card', 'Column', 'Last updated')
    for (let column of columns.data) {
        let cards = await octokit.projects.listCards({
            column_id: column.id
        })

        for (let card of cards.data) {
            if (!card.content_url) {
                // This is a note, not an issue.
                continue;
            }

            let splitURL = card.content_url.split('/');
            let issue = await octokit.issues.get({
                owner: splitURL[4],
                repo: splitURL[5],
                number: splitURL[7]
            })
            addResultRow(
                issue.data.html_url, [issue.data.title, column.name, moment(issue.data.updated_at).fromNow()]
            )
        }
    }

    projectRunButton.disabled = false;
};

projectRunButton.addEventListener("click", run);