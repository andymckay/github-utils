let table = document.getElementById('results');

function save(event) {
    event.preventDefault();
    let formData = new FormData(event.target);
    let key = event.target.getAttribute('id');
    for (let entry of formData.entries()) {
        window.localStorage.setItem(`${key}:${entry[0]}`, entry[1]);
    }

    hidePat(event);
    event.preventDefault();
}

function hidePat(event) {
    document.getElementById('pat').style.display = 'none';
    document.getElementById("show-pat").style.display = 'block';
}

function showPat(event) {
    document.getElementById('pat').style.display = 'block';
    document.getElementById("show-pat").style.display = 'none';
}

function hashChangeEvent() {
    let hash = window.location.hash;

    if (!hash) {
        return;
    }

    for (let tab of document.querySelectorAll('a.tabnav-tab')) {
        tab.classList.remove('selected');
    }

    for (let wrapper of document.getElementsByClassName('wrapper')) {
        wrapper.style.display = "none";
    }

    let chosen = document.querySelector(`a[href="${hash}"]`);
    chosen.classList.add("selected");
    document.getElementById(hash.slice(1)).style.display = "block";
}

function getOctoKit() {
    const octokit = new Octokit();
    let pat = window.localStorage.getItem('pat:pat');

    octokit.authenticate({
        type: 'token',
        token: pat
    })

    octokit.hook.error('request', async(error, options) => {
        alert('Got an error back from GitHub, check the console.');
        console.log(error);
        throw error
    })

    return octokit;
}

function resultsReset() {
    table.getElementsByTagName('thead')[0].innerHTML = '';
    table.getElementsByTagName('tbody')[0].innerHTML = '';
}

function addResultColumns(...headers) {
    for (let text of headers) {
        let header = document.createElement('th');
        header.innerText = text;
        table.getElementsByTagName('thead')[0].appendChild(header);
    }
    document.getElementById('no-results').style.display = 'none';
}

function addResultRow(url, fields) {
    let row = document.createElement('tr');
    for (let k in fields) {
        let field = fields[k];
        let td = document.createElement('td');
        if (k == 0) {
            let a = document.createElement('a');
            a.href = url;
            a.innerText = field;
            td.appendChild(a);
        } else {
            td.innerText = field;
        }
        row.appendChild(td)
    }
    table.getElementsByTagName('tbody')[0].appendChild(row);
}

window.addEventListener("load", function(event) {
    let formIds = [];
    for (let form of document.getElementsByTagName('form')) {
        formIds.push(form.getAttribute('id'));
    }

    for (let key in localStorage) {
        let [prefix, actualKey, ..._] = key.split(':');
        if (prefix && actualKey) {
            let fields = document.querySelectorAll(`form[id="${prefix}"] > input[name="${actualKey}"]`);
            if (fields.length < 1) {
                console.log(`Could not find a field for ${prefix}.`);
            } else {
                fields[0].value = window.localStorage.getItem(key);
            }


        }
    }

    let forms = document.getElementsByClassName("save-form")
    for (let form of forms) {
        form.addEventListener("submit", save);
    }


    hashChangeEvent();
    document.getElementById("show-pat").addEventListener("click", showPat);
});

window.addEventListener("hashchange", hashChangeEvent);