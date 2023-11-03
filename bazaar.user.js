// ==UserScript==
// @name         Cute's Bazaar Helper
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Cute's Bazaar Helper
// @author       Cute [2068379]
// @match        https://www.torn.com/bazaar.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @updateURL    https://github.com/innocent-angle/torn-bazaar-helper/raw/main/bazaar.user.js
// @downloadURL  https://github.com/innocent-angle/torn-bazaar-helper/raw/main/bazaar.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async() => {
    let itemData;

    function askForKey() {
        const input = prompt("Torn Key");
        if (input && input.length == 16) {
            return GM_setValue("ct-bazaar-key", input)
        } else {
            return alert("Invalid Key");
        }
    }

    function getKey() {
        return GM_getValue("ct-bazaar-key", null);
    }

    function addElements() {
        if (document.querySelector("#ct-autofill-button")) return;
        if (location.hash != "#/add" && location.hash != "#/manage") return;

        console.log("CuteTools: Creating elements.");

        const button = document.createElement("a");
        button.innerText = "AutoFill";
        button.className = "linkContainer___X16y4";
        button.id = "ct-autofill-button";
        button.style.color = "#8dba06";
        button.style.fontWeight = 700;
        button.style.marginLeft = "5px";
        button.addEventListener("click", async () => {
            if (getKey() == null) return askForKey();
            await updateItemData();
            fillAll();
        })
        
        document.querySelector(".titleContainer___QrlWP")
        .append(button);
    }

    async function fillAll() {
        if (!itemData) return console.log("CuteTools: No item data found, cancelling.");

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

                const oldPrice = parseInt(priceInput.value.replaceAll(",", ""));
                const newPrice = priceCalc(bazaar, value);

                if (oldPrice != newPrice) {
                    console.log(`CuteTools: ${itemName}: ${oldPrice.toLocaleString()} -> ${newPrice.toLocaleString()} (${Math.round(newPrice / oldPrice * 100)}%)`)
                    priceInput.value = priceCalc(bazaar, value);
                    priceInput.dispatchEvent(new Event("input", {bubbles: true}))
                }
            }, increment * 1000);
            increment++;
        })

        return;
    }

    function priceCalc(bazaar, value) {
        if (!bazaar || bazaar < value * .90) return value;
        return bazaar - 1;
    }

    async function updateItemData() {
        let itemDataCache = GM_getValue("ct-item-data", null);
        if (itemDataCache) {
            itemDataCache = JSON.parse(itemDataCache);
            if (itemDataCache.lastUpdatedDay && new Date().getUTCDate() == itemDataCache.lastUpdatedDay) return itemData = itemDataCache;
        } else {
            try {
                console.log("CuteTools: Fetching item data.");
                const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${getKey()}&comment=CuteTools`);
                const json = await response.json();

                itemData = {
                    lastUpdatedDay: new Date().getUTCDate(),
                    data: json.items
                }

                GM_setValue("ct-item-data", JSON.stringify(itemData));
            } catch (e) {
                console.log("CuteTools: Failed to fetch item data.", e)
            }
        }
        console.log("CuteTools: Done fetching item data.");
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

    new MutationObserver(() => {
        if (document.querySelector("#bazaarRoot") && !document.querySelector("#ct-autofill-button")) {
            addElements();
        }
    }).observe(document.body, {
        childList: true,
        subtree: true
    });
})();