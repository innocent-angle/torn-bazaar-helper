// ==UserScript==
// @name         Cute's Bazaar Helper
// @namespace    http://tampermonkey.net/
// @version      1.4
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

    function askForKey() {
        const input = prompt("Torn Key");
        if (input && input.length == 16) {
            return localStorage.setItem("ct-bazaar-key", input) 
        } else {
            return alert("Invalid Key");
        }
    }

    function getKey() {
        return localStorage.getItem("ct-bazaar-key");
    }

    function addElements() {
        if (document.querySelector("#ct-autofill-button")) return;
        
        const loadInterval = setInterval(() => {
            if (document.querySelector("#bazaarRoot") !== null) {
                clearInterval(loadInterval);
                
                console.log("CuteTools: Creating elements.");

                const button = document.createElement("a")
                button.innerText = "AutoFill";
                button.className = "linkContainer___X16y4";
                button.id = "ct-autofill-button";
                button.style.color = "#8dba06";
                button.style.fontWeight = 700;
                button.style.marginLeft = "5px";
                button.addEventListener("click", () => {
                    if (getKey() == null) return askForKey();
                    updateItemData();
                    fillAll();
                })
                
                document.querySelector(".titleContainer___QrlWP")
                .append(button);
            }
        }, 100);
    }

    async function fillAll() {
        let increment = 0;

        document.querySelectorAll(".input-money").forEach((element) => {
            if (!element.offsetParent) return;

            let fillElement;
            let itemName;
            let itemAmount;
            let itemID;
            let value;
            let bazaar;

            switch (location.hash) {
                case "#/manage":
                    fillElement = element.closest('[class^="row"]');
                    break;

                case "#/add":
                    fillElement = element.closest('.clearfix:not(.actions-main-wrap)');
                    itemAmount = fillElement.querySelector("span:nth-child(2)");

                    const qtyInput = fillElement.querySelector("input.clear-all");
                    const checkbox = fillElement.querySelector("input[type=checkbox]");

                    if (!checkbox && itemAmount) {
                        qtyInput.value = itemAmount.textContent;
                    } else if (!checkbox && !itemAmount) {
                        qtyInput.value = 1;
                    }

                    if (checkbox && !checkbox.checked) checkbox.click();
                    if (qtyInput) qtyInput.dispatchEvent(new Event("keyup", {bubbles: true}))
                    break;
            
                default:
                    break;
            }

            setTimeout(async () => {
                const priceInput = fillElement.querySelector("input.input-money");
    
                itemName = fillElement.querySelector("img").alt;
                itemID = getIDFromName(itemName);
                bazaar = await getLowestBazaar(itemID, itemName);
                value = getTornValueFromName(itemName);

                priceInput.value = priceCalc(bazaar, value);
                priceInput.dispatchEvent(new Event("input", {bubbles: true}))
            }, increment * 1000);
            increment++;
        })

        return;
    }

    function priceCalc(bazaar, value) {
        if (!bazaar || bazaar < value * .97) return value;
        return bazaar - 1;
    }

    async function updateItemData() {
        if (localStorage.getItem("ct-item-data")) {
            itemData = JSON.parse(localStorage.getItem("ct-item-data"));
            if (itemData.lastUpdatedDay && new Date().getUTCDate() == itemData.lastUpdatedDay) return;
        }

        try {
            console.log("CuteTools: Fetching item data.");
            const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${getKey()}&comment=CuteTools`);
            const json = await response.json();
        } catch (e) {
            console.log("CuteTools: Failed to fetch item data.")
            return;
        }

        itemData = {
            lastUpdatedDay: new Date().getUTCDate(),
            data: json.items
        }

        localStorage.setItem("ct-item-data", JSON.stringify(itemData));
    }

    function getIDFromName(name) {
        for (const i in itemData.data) {
            if (Object.hasOwnProperty.call(itemData.data, i)) {
                const item = itemData.data[i];
                if (item.name == name) {
                    return i;
                }
            }
        }
    }

    function getTornValueFromName(name) {
        for (const i in itemData.data) {
            if (Object.hasOwnProperty.call(itemData.data, i)) {
                const item = itemData.data[i];
                if (item.name == name) {
                    return item.market_value;
                }
            }
        }
    }

    async function getLowestBazaar(id, name) {
        try {
            console.log("CuteTools: Fetching lowest bazaar for: " + name);
            const response = await fetch(`https://api.torn.com/market/${id}?selections=bazaar&key=${getKey()}&comment=CuteTools`);
            const json = await response.json();
            return json.bazaar[0].cost;
        } catch (e) {
            console.log("CuteTools: Failed to fetch bazaar data for: " + name);
            return null;
        }
    }

    async function main() {
        addElements();
    }

    addEventListener("hashchange", () => {
        if (button) {
            button.remove();
            button = null;
        }
        addElements();
    })

    main();
})();