sap.ui.define([
], function (Constants) {
    "use strict";

    return {
	 
        getEndpoint: function (oOptions) {
            return oOptions.endPoint;
        },

	/**
        getBaseURL: modificar getModulePath , modificar según el path de la aplicación
			en este caso CRUD.CRUD
			EJ: Si tu namespace es manzana y tu htmlmodule es manzana.
			Quedaría getModulePath(manzana.manzana)
        */

        getBaseURL: function (sEndPoint) {
            return jQuery.sap.getModulePath("tmsmanifest.tmsmanifest") + "/";
        },

 /* getLocalJSON: Si por algun motivo trabajas con archivos JSON locales, debes cargar tu archivo JSON en la carpeta localService y hacer la misma modificación de getModulePath como en getBaseURL sino borrar getLocalJSON o comentarlo*/

        getLocalJSON: function (sJsonName) {
            return this.promisizer(jQuery.sap.getModulePath("tmsmanifest.tmsmanifest") + "/util/" + sJsonName);
        },

        /**
        * Converts a jQuery AJAX promise into a mainline promise
        * @param {object} oPromise jQuery Deferred object
        */  
        toPromise: function (oPromise) {
            return new Promise(function (resolve, reject) {
                oPromise.then(() => {
                    const sHeaders = oPromise.done().getAllResponseHeaders();
                    const aHeaders = sHeaders.trim().split(/[\r\n]+/);
                    const oHeaderMap = {};
                    aHeaders.forEach(function (sLine) {
                        const aParts = sLine.split(': ');
                        const sHeader = aParts.shift();
                        const sValue = aParts.join(': ');
                        oHeaderMap[sHeader] = sValue;
                    });                    
                    resolve([oPromise.done().responseJSON, oHeaderMap]);
                }, reject);
            });
        },

        /**
        * Wrapper function, creates an jQuery deferred object for AJAX
        * @param {object} oOptions Request options
        */
        promisizer: function (oOptions) {
            return this.toPromise(jQuery.ajax(oOptions));
        },
      







        /**
        * Gets an object with jQuery.ajax compatible properties
        * @param {Object} oOptions Mapped hash of URL info properties
        * @param {string} oOptions.endPoint Connection endpoint (SCP)
        * @param {string} oOptions.method Request method, e.g GET
        * @param {Boolean} oOptions.fetch Request flag for fetching a CSRF token
        * @param {string} oOptions.params URL Like string parameters
        * @param {string} oOptions.data Request data
        */

        getRequest: function (oOptions = {}) {
            const oHeaders = {
                'Content-Type': "application/json;charset=UTF-8;IEEE754Compatible=true",
                'accept': "application/json",
                'Access-Control-Allow-Origin': "*"
            };
            if (oOptions.username && oOptions.password) {
                oHeaders.Authorization = "Basic " + btoa(oOptions.username + ":" + oOptions.password);
            }
            if (oOptions.fetch) {
                oHeaders['X-CSRF-TOKEN'] = 'Fetch';
            }
            if (oOptions.method === 'POST') {
                oHeaders['X-CSRF-TOKEN'] = localStorage.getItem('csrf');
            }
            const sParams = oOptions.params ? "?" + oOptions.params : "";
            return {
                headers: oHeaders,
                url: this.getBaseURL(oOptions.endPoint) + this.getEndpoint(oOptions) + "/" + (oOptions.entity || '') + sParams,
                method: oOptions.method,
                data: oOptions.data || ''
            };
        },

        getCamion: function () {
            const oRequest = this.getRequest({
                    endPoint:"AOPDS8160",
                    method: "GET",
                    entity: "/sap/opu/odata/sap/ZTM_CARGO_MANIFEST_SRV"
                });
                return this.promisizer(oRequest);
        }
    }
});
