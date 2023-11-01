// ==UserScript==
// @name         Cute's Bazaar Helper
// @namespace    http://tampermonkey.net/
// @version      1.3
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

    async function fillAll() {
        let increment = 0;

        console.log(document.querySelectorAll(".input-money").length);
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
        if (bazaar < value * .95) return value;
        return bazaar - 1;
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

    main();
})();