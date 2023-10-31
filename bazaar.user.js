// ==UserScript==
// @name         Cute's Bazaar Helper
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Cute's Bazaar Helper
// @author       Cute [2068379]
// @match        https://www.torn.com/bazaar.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @updateURL    https://github.com/innocent-angle/torn-bazaar-helper/raw/main/bazaar.user.js
// @downloadURL  https://github.com/innocent-angle/torn-bazaar-helper/raw/main/bazaar.user.js
// @grant        none
// ==/UserScript==

(async() => {
    let itemData;
    let button;

    function askForKey() {
        const input = prompt("Torn Key");
        if (input && input.length == 16) {
            return localStorage.setItem("CuteToolsBazaarKey", input) 
        } else {
            return alert("Invalid Key");
        }
    }

    function getKey() {
        return localStorage.getItem("CuteToolsBazaarKey");
    }

    function addElements() {
        if (button) return;
        
        const loadInterval = setInterval(() => {
            if (document.querySelector("#bazaarRoot") !== null) {
                clearInterval(loadInterval);
                
                console.log("CuteTools: Creating elements.");

                button = document.createElement("a")
                button.innerText = "AutoFill";
                button.className = "linkContainer___X16y4";
                button.style.color = "#8dba06";
                button.style.fontWeight = 700;
                button.style.marginLeft = "5px";
                button.addEventListener("click", () => {
                    if (getKey() == null) return askForKey();
                    fillAll();
                })
                
                document.querySelector(".titleContainer___QrlWP")
                .append(button);
            }
        }, 100);
    }

    function getActiveContainer() {
        if (!document.querySelector("div.category-wrap:nth-child(1)")) return;
        const itemContainers = document.querySelector("div.category-wrap:nth-child(1)").children;
        for (const c in itemContainers) {
            if (Object.hasOwnProperty.call(itemContainers, c)) {
                const container = itemContainers[c];
                if (container.style.display === "block") return container;
            }
        }
    }

    async function fillAll() {
        const container = getActiveContainer(); 
        if (!container) return;
        let increment = 0;
        for (const c in container.children) {
            if (Object.hasOwnProperty.call(container.children, c)) {
                const child = container.children[c];
                if (child.className === "clearfix no-mods") {
                    setTimeout(() => {
                        fill(child)
                    }, increment * 1000);
                    increment++
                    // break;
                }
            }
        }
    }

    async function getItemData() {
        console.log("CuteTools: Fetching item data.");
        const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${getKey()}&comment=CuteTools`);
        const json = await response.json();
        itemData = json.items;
    }

    function getIDFromName(name) {
        for (const i in itemData) {
            if (Object.hasOwnProperty.call(itemData, i)) {
                const item = itemData[i];
                if (item.name == name) {
                    return i;
                }
            }
        }
    }

    function getTornValueFromName(name) {
        for (const i in itemData) {
            if (Object.hasOwnProperty.call(itemData, i)) {
                const item = itemData[i];
                if (item.name == name) {
                    return item.market_value;
                }
            }
        }
    }

    async function getLowestBazaar(id, name) {
        console.log("CuteTools: Fetching lowest bazaar for: " + name);
        const response = await fetch(`https://api.torn.com/market/${id}?selections=bazaar&key=${getKey()}&comment=CuteTools`);
        const json = await response.json();
        return json.bazaar[0].cost;
    }

    async function fill(child) {
        const itemName = child.querySelector("div.title-wrap > div.name-wrap.bold > span.t-overflow").textContent;
        const itemAmount = child.querySelector("div.title-wrap > div.name-wrap.bold > span.t-hide > span:nth-child(2)");
        const itemID = getIDFromName(itemName);
        const value = getTornValueFromName(itemName);
        const bazaar = await getLowestBazaar(itemID, itemName);

        const qtyInput = child.querySelector("div.actions-main-wrap.clearfix div.amount-main-wrap div.amount input.clear-all");

        let priceInput = child.querySelector("div.amount-main-wrap div.price div.input-money-group.success input.clear-all.input-money");
        if (priceInput === null) priceInput = child.querySelector("div.actions-main-wrap.clearfix div.amount-main-wrap div.price div.input-money-group input.clear-all.input-money");

        priceInput.value = bazaar - 1;

        if (itemAmount) {
            qtyInput.value = itemAmount.textContent;
        } else {
            qtyInput.value = 1;
        }

        qtyInput.dispatchEvent(new Event("keyup", {bubbles: true}))
        priceInput.dispatchEvent(new Event("input", {bubbles: true}))
    }

    async function main() {
        getItemData();
        addElements();
    }

    addEventListener("hashchange", () => {
        if (button) {
            button.remove();
            button = null;
        }
        addElements();
    })

    // new MutationObserver(entries => {
    //     addElements();
    // }).observe(document.querySelector("html body#body.d.body.webp-support.r.regular.with-sidebar.dark-mode div.content.responsive-sidebar-container.logged-in div#mainContainer.container div.content-wrapper.autumn div#bazaarRoot div.core-layout___uf3LW"), 
    // {childList: true});

    main();
})();