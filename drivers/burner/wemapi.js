const fetch = require('node-fetch');
const { URLSearchParams } = require('url');


const baseUrl = 'https://www.wemportal.com/app';
let cookie = '';
global.ModuleIndex = null;
const wemHeaders = {
    'Content-Type': 'application/json',
    "User-Agent": "WeishauptWEMApp",
    "X-Api-Version": "2.0.0.0",
    "Accept": "*/*",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
};

class WemApi {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async initializeSession() {
        const accountUrl = `${baseUrl}/Account/Login`;

        const requestBody = JSON.stringify({
            "Name": this.username,
            "PasswordUTF8": this.password,
            "AppID": "de.weishaupt.wemapp",
            "AppVersion": "2.0.2",
            "ClientOS": "Android"
        });
        const apiData = await this.apiRequest(accountUrl, 'POST', requestBody);
    }

    async apiRequest(url, methodContent, requestBody) {
        const apiResponse = await fetch(url, {
            method: methodContent,
            headers: {
                'Content-Type': 'application/json',
                "User-Agent": "WeishauptWEMApp",
                "X-Api-Version": "2.0.0.0",
                "Accept": "*/*"
            },
            body: requestBody,
        });
        const apiData = await apiResponse;
        cookie = apiData.headers.get('set-cookie').split(";")[0];

        if (apiData.statusText === 'OK') {
            return apiData;

        }

        throw new Error(apiData.status);
    }
    async getSystems() {
        const systemsUrl = `${baseUrl}/Device/Read`;
        wemHeaders["Cookie"] = cookie;
        const response = await fetch(systemsUrl, {
            headers: wemHeaders
        });
        const apiData = await response.json();
        return apiData["Devices"];
    }

    async refreshData(bodyData) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const systemsUrl = `${baseUrl}/DataAccess/Refresh`;
        console.log(cookie)
        wemHeaders["Cookie"] = cookie;
        console.log(bodyData);
        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: wemHeaders,
            body: bodyData
        });

        const apiData = await response.json();
        console.log(apiData);
    }

    async getIndoorTemperature(ID) {
        const systemsUrl = `${baseUrl}/DataAccess/Read`;
        let bodyData = "";
        bodyData = JSON.stringify({
            "DeviceID": ID,
            "Modules": [
                {
                    "ModuleIndex": 0,
                    "ModuleType": 2,
                    "Parameters": [
                        {
                            "ParameterID": "Raumtemperatur"
                        }
                    ]
                },
                {
                    "ModuleIndex": 1,
                    "ModuleType": 2,
                    "Parameters": [
                        {
                            "ParameterID": "Raumtemperatur"
                        }
                    ]
                }
            ]
        });
        await this.refreshData(bodyData);
        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: wemHeaders,
            body: bodyData
        });


        const apiData = await response.json();
        for (let i = 0; i < apiData["Modules"].length; i++) {
            if (apiData["Modules"][i]["Values"][0]["NumericValue"] != null) {
                apiData["Modules"][i]["Values"][0]['ModuleIndex'] = apiData["Modules"][i]["ModuleIndex"];
                return apiData["Modules"][i]["Values"][0]
            }
        }
    }
    async generator(ModuleIndex, ModuleType, ParameterID) {
        return { "ModuleIndex": ModuleIndex, "ModuleType": ModuleType, "Parameters": [{ "ParameterID": ParameterID }] }
    }
    // 
    async queryApi(ID, data) {
        let currentMode = "";
        let comfort = "";
        let normal = "";
        let decreased = "";
        let outdoor = "";

        console.log(data);

        const systemsUrl = `${baseUrl}/DataAccess/Read`;

        let bodyData = "";
        try {

            bodyData = JSON.stringify({
                "DeviceID": ID,
                "Modules":
                    data

            });
            await this.refreshData(bodyData);
            wemHeaders["Cookie"] = cookie;

            const response = await fetch(systemsUrl, {
                method: "POST",
                headers: wemHeaders,
                body: bodyData
            });

            const apiData = await response.json();

            for (let i = 0; i < apiData["Modules"][0]["Values"].length; i++) {
                console.log("loop");
                if (apiData["Modules"][0]["Values"][i]["NumericValue"] != null) {
                    if (apiData["Modules"][0]["Values"][i]["ParameterID"] == "Betriebsart") {
                        currentMode = apiData["Modules"][0]["Values"][i]["StringValue"];
                    }
                    if (apiData["Modules"][0]["Values"][i]["ParameterID"] == "Komfort") {
                        comfort = apiData["Modules"][0]["Values"][i]["NumericValue"];
                    }
                    if (apiData["Modules"][0]["Values"][i]["ParameterID"] == "Normal") {
                        normal = apiData["Modules"][0]["Values"][i]["NumericValue"];
                    }
                    if (apiData["Modules"][0]["Values"][i]["ParameterID"] == "Absenk") {
                        decreased = apiData["Modules"][0]["Values"][i]["NumericValue"];
                    }
                    if (apiData["Modules"][0]["Values"][i]["ParameterID"] == "Außentemperatur") {
                        outdoor = apiData["Modules"][0]["Values"][i]["NumericValue"];
                    }
                    // return apiData["Modules"][i]["Values"][0]
                }
            }
            return { currentMode, comfort, normal, decreased, outdoor };

        }
        catch (e) {
            console.log(e)
        }

    }

    async writeSettings(ID, ModuleIndex, ModuleType, ParameterID, newValue) {
        const systemsUrl = `${baseUrl}/DataAccess/Write`;
        let bodyData = "";
        try {

            bodyData = JSON.stringify({
                "DeviceID": ID,
                "Modules": [
                    {
                        "ModuleIndex": ModuleIndex,
                        "ModuleType": ModuleType,
                        "Parameters": [
                            {
                                "ParameterID": ParameterID,
                                "NumericValue": newValue
                            }
                        ]
                    }
                ]
            });
            wemHeaders["Cookie"] = cookie;

            const response = await fetch(systemsUrl, {
                method: "POST",
                headers: wemHeaders,
                body: bodyData
            });
        }
        catch (e) {
            console.log(e)
        }
    }

}

module.exports = { WemApi };
