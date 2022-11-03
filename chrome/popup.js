console.log("This is a popup!")

const syncButton = document.getElementById("syncButton");
// const autoSyncCheck = document.getElementById("autoSyncCheck")

const saveTabs = async (tabs) => {
    const host = document.getElementById("host");

    fetch(host, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: tabs
    })
    .then(response => response.json())
    .then(response => console.log(response))
    .catch(error => console.log('Error:', error));
}

syncButton.addEventListener("click", async () => {
    console.log("Sync Button was pressed")
    const tabs = await chrome.tabs.query({})
    const groups = await chrome.tabGroups.query({})
    const groupCache = Object.assign({}, ...groups.map((group) => ({[group.id]: group.title})));
    const normalizedTabs = tabs.map(tab => ({ ...tab, groupName: groupCache[tab.groupId] }))
    console.log(normalizedTabs)
});

