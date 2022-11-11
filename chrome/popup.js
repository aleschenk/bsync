const saveSessionButton = document.getElementById("saveSessionButton");
const getSessionButton = document.getElementById("getSessionButton");

const sessionUrl = () => {
    const host = document.getElementById("hostText").value
    const accountId = document.getElementById("accountIdText").value
    const sessionId = document.getElementById("sessionIdText").value
    return host + "/accounts/" + accountId + "/sessions/" + sessionId
}
const sessionsUrl = () => {
    const host = document.getElementById("hostText").value
    const accountId = document.getElementById("accountIdText").value
    return host + "/accounts/" + accountId + "/sessions"
}

const createNewAccount = async () => {
    var form = new FormData(document.getElementById('login-form'));
    fetch("/login", {
      method: "POST",
      body: form
    });
}

const saveTabs = async (tabs) => {
    const response = await fetch(sessionsUrl(), {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(tabs)
    });

    // .then(response => response.json())
    // .then(response => console.log(response))
    // .catch(error => console.log('Error:', error));
}

const createNewTab = async(tab) => {
    const response = await chrome.tabs.create({active:false, selected:false, url:""})
}

const updateSession = async(tabs) => {
    tabs.array.forEach(tab => {
        const tab = chrome.tabs.query({title:tab.title, url:tab.url})
        if (tab == undefined) {
            console.log("The tab not exists")
            // createNewTab(tab)
        } else {
            console.log("The tab already exists")
        }
    });
}

getSessionButton.addEventListener("click", async () => {
    const response = await fetch(sessionUrl(), {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
    console.log(response.body)
    //updateSession()
})

saveSessionButton.addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({})
    const groups = await chrome.tabGroups.query({})
    const groupCache = Object.assign({}, ...groups.map((group) => ({[group.id]: group.title})));
    const normalizedTabs = tabs
        .map(tab => ({ ...tab, groupName: groupCache[tab.groupId] }))
        .map(function(item) { 
            delete item.vivExtData;
            return item; 
        })
    console.log(normalizedTabs)
    saveTabs(normalizedTabs)
})

