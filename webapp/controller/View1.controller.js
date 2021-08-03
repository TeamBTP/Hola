sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "tmsmanifest/tmsmanifest/util/Services",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/mvc/View",
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    "tmsmanifest/tmsmanifest/util/Constants",
    "tmsmanifest/tmsmanifest/util/Formatter",
    "sap/ui/table/RowSettings",
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (Controller, Services, JSONModel, Filter, FilterOperator, View, MessageToast, MessageBox, Constants, Formatter, RowSettings) {
        "use strict";

        return Controller.extend("tmsmanifest.tmsmanifest.controller.View1", {
            Formatter: Formatter,
            onInit: function () {
                // jQuery.ajax({
                //     url: 'tmsmanifest/parameters/Category',
                //     type: "GET",
                //     dataType: "json",
                //     success: function(result) {
                //         console.log("*****************Inside success "+result);
                //     },
                //     error: function(e) {
                //         // log error in browser
                //         console.log(e.message);
                //     }
                // });
                document.title = this._get_i18n("tab_title");
                this._getLanguageApp();
                this.oLoaderData = new sap.m.BusyDialog({
                    showCancelButton: false,
                    title: this._get_i18n("dialog_loading")
                });
                this.oLoaderApp = new sap.m.BusyDialog({
                    showCancelButton: false,
                    title: this._get_i18n("dialog_loading_data")
                });
                this.temps = [];
                this.errors = {};
                //Array de dialogs, aqui se guardaran todos los dialogs que usaremos para no tener que crearlos cada vez que se llamen
                this.Dialogs = {}
                //Aqui se guardara el dialog que se este usando en ese momento en la App
                this.Dialog;
                //Funcion que carga la data en el modelo principal de la App 
                // this.loadModel();
                //Funcion que carga la data de tipo de transporte
                // this.loadTransportModel();
                //Se crea y guarda el modelo de que contendra a la guia seleccionada
                let oModel = new JSONModel();
                this.getOwnerComponent().setModel(oModel, Constants.model.guideModel);
                //Se crea y guarda el modelo que contendra los items del bulto que se este creando
                let oData = {
                    items: []
                }
                oModel = new JSONModel(oData);
                this.getOwnerComponent().setModel(oModel, Constants.model.palletModel);
                //Se crea y guarda el modelo que contendra informacion util para distintas partes de la app
                let toDay = new Date();
                toDay = this.formatDate(toDay);
                let oInfo = {
                    typeMaterials: "",
                    pathTransport: "",
                    transport: "",
                    countItems: 0,
                    countPallets: 0,
                    weight: 0,
                    totalWeight: 0,
                    bultos: 0,
                    typeBulto: "",
                    nameT: "Transport TM",
                    plate: "",
                    license: "",
                    startDate: toDay,
                    obs: "",
                    EX_LGORT: "",
                    brand: ""
                };
                oModel = new JSONModel(oInfo);
                this.getView().setModel(oModel, Constants.model.infoModel);
                //Se crea y guarda el modelo que contendra los bultos de una orden de envio
                oData = {
                    pallets: []
                }
                oModel = new JSONModel(oData);
                this.getView().setModel(oModel, Constants.model.orderModel);
                //Se crea y guarda la data del tipo de tranasporte 
                this.getTransportType();
                this.getCarrier();
                this.getTypeBulto();
                this.getUserInfo().then((resolve)=>{
                    if (resolve.EX_RESPONSE == "S") {
                        this.userConnected = resolve.EX_DATA;
                    } else {
                        console.log(resolve.EX_DATA);
                    }
                });
                this.getMaterialsUser(this.userConnected);
            },

            //--------------------------------->FUNCIONES COMUNES<----------------------------------

            //Funcion para obtener el texto en el idioma que se requiere
            _get_i18n: function (key) {
                var oController = this;
                return oController.getOwnerComponent().getModel("i18n").getResourceBundle().getText(key);
            },
            //
            _getLanguageApp: function () {
                var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
                if (sCurrentLocale == "en") {
                    sap.ui.getCore().getConfiguration().applySettings({
                        language: "en"
                    });
                } else {
                    sap.ui.getCore().getConfiguration().applySettings({
                        language: "en" //es
                    });
                }
            },
            _buildDialog: function (_title, _state, _text) {
                var oController = this;
                var dialog = new sap.m.Dialog({
                    title: _title,
                    type: 'Message',
                    state: _state,
                    content: new sap.m.Text({
                        text: _text
                    }),
                    beginButton: new sap.m.Button({
                        text: oController._get_i18n("accept"),
                        press: function () {
                            dialog.close();
                        }
                    }),
                    afterClose: function () {
                        // oController.reiniciarFormulario();
                        dialog.destroy();
                    }
                });
                return dialog;
            },
            _buildDialogFinish: function (_title, _state, _text) {
                var oController = this;
                var dialog = new sap.m.Dialog({
                    title: _title,
                    type: 'Message',
                    state: _state,
                    content: new sap.m.Text({
                        text: _text
                    }),
                    beginButton: new sap.m.Button({
                        text: oController._get_i18n("accept"),
                        press: function () {
                            dialog.close();
                        }
                    }),
                    afterClose: function () {
                        // oController.reiniciarFormulario();
                        dialog.destroy();
                        let tabs = oController.byId(Constants.ids.mainView.iconTabBar);
                        let count = 0;
                        tabs.getItems().forEach(tab => {
                            if (count % 2 == 0 ) {
                                tab.setEnabled(false);
                            }
                            count++;
                        });
                        location.reload();
                        
                    }
                });
                return dialog;
            },
            getUserInfo: function () {
                let that = this;
                return new Promise(function(resolve, reject) {
                    try {
                        if(top.sap.ushell!= undefined){
                            let user = top.sap.ushell.Container.getUser();
                            that.userConnected = user.getEmail() != undefined ? user.getEmail() : 'usuarioDefecto';
                        }else{
                            that.userConnected ='usuarioDefecto';
                        }
                        let res = { EX_RESPONSE: "S", EX_DATA: that.userConnected };
                        resolve(res);

                    } catch (e) {
                        console.log('No se logro obtener el usuario', e);
                        that._buildDialog(that._get_i18n("dialog_error"), "Error", that._get_i18n("dialog_msg_9")).open();
                        let res = { EX_RESPONSE: "E", EX_DATA: e };
                        resolve(res);
                    }
                });

            },
            formatDate: function (date) {
                var d = new Date(date),
                    month = '' + (d.getMonth() + 1),
                    day = '' + d.getDate(),
                    year = d.getFullYear();

                if (month.length < 2)
                    month = '0' + month;
                if (day.length < 2)
                    day = '0' + day;

                return [year, month, day].join('');
            },
            //-----------------------------------------------------------------------------------

            //--------------------------------->FUNCIONES PARA OBTENER DATA<----------------------------------
            requestCAP: function (Url, oData, request) {
                let oController = this;
                var oModel = new sap.ui.model.json.JSONModel();
                return new Promise(function (resolve, reject) {
                    oModel.loadData(Url, JSON.stringify(oData), true, request, false, true, {
                        "content-type": "application/json;odata.metadata=minimal",
                        "content-type": "application/json;IEEE754Compatible=true"
                    });
                    oModel.attachRequestCompleted(function () {
                        let data = oModel.getData();
                        let res = { EX_RESPONSE: "S", EX_DATA: data };
                        resolve(res)
                    });
                    oModel.attachRequestFailed(function () {
                        let xhr = oModel.getData();
                        let res = { EX_RESPONSE: "E", EX_DATA: xhr };
                        resolve(res);
                    });
                })
            },
            getCentroCosto: async function (centro) {
                var URL = "tmsmanifest/parameters/Category?$filter=(name%20eq%20%27CENTRO_COSTO-" + centro + "%27)&$expand=parameter($filter=active%20eq%20true)";
                var oData = {

                };
                let response = await this.requestCAP(URL, oData, 'GET');
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " CENTRO_COSTO-" + centro).open();
                    } else {
                        let oModel = new JSONModel(response.EX_DATA);
                        this.getOwnerComponent().setModel(oModel, Constants.model.centroModel);
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/parameters/Category" + this._get_i18n("dialog_msg_2_1")).open();
                }

            },
            getSourceStorage: async function () {
                var URL = "tmsmanifest/parameters/Category?$filter=(name eq 'SOURCE STORAGE LOCATION')&$expand=parameter($filter=active%20eq%20true)";
                var oData = {

                };
                let response = await this.requestCAP(URL, oData, 'GET');
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " CENTRO_COSTO-" + centro).open();
                    } else {
                        // console.log(response.EX_DATA);
                        let oStorages = this.getOwnerComponent().getModel(Constants.model.storageModel).getData();
                        oStorages.forEach(storage => {
                            storage.enable = false;
                        });
                        oStorages.forEach(storage => {
                            response.EX_DATA.value[0].parameter.forEach(sourceStorage => {
                                if (storage.EX_LGORT == sourceStorage.value) {
                                    storage.enable = true;
                                }
                            });
                        });
                        this.getOwnerComponent().getModel(Constants.model.storageModel).setData(oStorages);
                        // let oModel = new JSONModel();
                        // this.getOwnerComponent().setModel(oModel, Constants.model.sourceStorageModel);
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/parameters/Category" + this._get_i18n("dialog_msg_2_1")).open();
                }
            },
            getTargetStorage: async function () {
                var URL = "tmsmanifest/parameters/Category?$filter=(name eq 'TARGET STORAGE LOCATION')&$expand=parameter($filter=active%20eq%20true)";
                var oData = {

                };
                let response = await this.requestCAP(URL, oData, 'GET');
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " CENTRO_COSTO-" + centro).open();
                    } else {
                        // console.log(response.EX_DATA);
                        let oStorages = this.getOwnerComponent().getModel(Constants.model.storageModel).getData();
                        oStorages.forEach(storage => {
                            storage.enable = false;
                        });
                        oStorages.forEach(storage => {
                            response.EX_DATA.value[0].parameter.forEach(targetStorage => {
                                if (storage.EX_LGORT == targetStorage.value) {
                                    storage.enable = true;
                                }
                            });
                        });
                        this.getOwnerComponent().getModel(Constants.model.storageModel).setData(oStorages);
                        // let oModel = new JSONModel();
                        // this.getOwnerComponent().setModel(oModel, Constants.model.sourceStorageModel);
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/parameters/Category" + this._get_i18n("dialog_msg_2_1")).open();
                }

            },
            getCarrier: async function () {
                var oController = this;
                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_CARRIERSet";
                var filters = []
                var oData = {};
                oController.oLoaderData.open();
                try {
                    let data = await oController.RequestSAPGETPromise(model, filters, service, oData);
                    if (data[0].EX_RESULTADO_EJECUCION == "S") {
                        // Response Ok
                        let oDataModel = [];
                        let json = {};
                        data.forEach(item => {
                            json.EX_PARTNER = item["EX_PARTNER"];
                            json.EX_NAME_ORG1 = item["EX_NAME_ORG1"];
                            oDataModel.push(json);
                            json = {}
                        });
                        let oModel = new JSONModel(oDataModel);
                        this.getOwnerComponent().setModel(oModel, Constants.model.carrierModel);
                    } else if (data[0].EX_RESULTADO_EJECUCION == "E") {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", data[0].EX_DSC_EJECUCION).open();
                    } else {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                    }
                    oController.oLoaderData.close();
                } catch (e) {
                    oController.oLoaderData.close();
                    //Response Error
                    console.log(e)
                    oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                }
            },
            //Funcion encargada de obtener la data (tipo de transportes) desde el servicio de ERP la cual es guardada en un modelo 
            getTypeBulto: async function () {
                var oController = this;
                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_PACK_TYPESet";
                var filters = []
                var oData = {};
                oController.oLoaderData.open();
                try {
                    let data = await oController.RequestSAPGETPromise(model, filters, service, oData);
                    if (data[0].EX_RESULTADO_EJECUCION == "S") {
                        // Response Ok
                        let oDataModel = [];
                        let json = {};
                        data.forEach(item => {
                            json.EX_TRAGR = item["EX_TRAGR"];
                            json.EX_VTEXT = item["EX_VTEXT"];
                            oDataModel.push(json);
                            json = {}
                        });
                        let oModel = new JSONModel(oDataModel);
                        this.getOwnerComponent().setModel(oModel, Constants.model.typeBultosModel);
                    } else if (data[0].EX_RESULTADO_EJECUCION == "E") {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", data[0].EX_DSC_EJECUCION).open();
                    } else {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                    }
                    oController.oLoaderData.close();
                } catch (e) {
                    oController.oLoaderData.close();
                    //Response Error
                    console.log(e)
                    oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                }
            },
            getHeaderData: async function () {
                var URL = "tmsmanifest/parameters/Category?$filter=(name%20eq%20%27HEADER_FREIGTH_ORDER%27)&$expand=parameter($filter=active%20eq%20true)";
                var oData = {

                };
                let response = await this.requestCAP(URL, oData, 'GET');
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " HEADER DE LA FREIGTH ORDER").open();
                    } else {
                        return response.EX_DATA;
                        // let oModel = new JSONModel(response.EX_DATA);
                        // this.getOwnerComponent().setModel(oModel, Constants.model.headerModel);
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/parameters/Category" + this._get_i18n("dialog_msg_2_1")).open();
                }

            },
            getDeliveryOrder: async function (code) {
                var URL = "tmsmanifest/cargo/DeliveryOrder?$filter=(code%20eq%20%27" + code + "%27)&$expand=item";
                var oData = {

                };
                let response = await this.requestCAP(URL, oData, 'GET');
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " Delivery Order").open();
                    } else {
                        return response.EX_DATA;
                        // let oModel = new JSONModel(response.EX_DATA);
                        // this.getOwnerComponent().setModel(oModel, Constants.model.centroModel);
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/parameters/Category" + this._get_i18n("dialog_msg_2_1")).open();
                }
            },
            postCheckGD: async function (data) {
                var URL = "tmsmanifest/cargo/CheckDeliveryOrder";
                this.oLoaderData.open();
                let response = await this.requestCAP(URL, data, 'POST');
                this.oLoaderData.close();
                return response.EX_DATA.value
            },
            postCreateFreightOrder: async function (data) {
                var URL = "tmsmanifest/cargo/CreateFreightOrder";
                this.oLoaderData.open();
                let response = await this.requestCAP(URL, data, 'POST');
                await this.deleteMaterials(this.temps);
                this.oLoaderData.close();
                console.log(response);
                // if (response.EX_RESPONSE == "S") {
                //     if (Object.entries(response.EX_DATA).length === 0){
                //         this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " Delivery Order").open();    
                //     } else {
                //         return response.EX_DATA;
                //         // let oModel = new JSONModel(response.EX_DATA);
                //         // this.getOwnerComponent().setModel(oModel, Constants.model.centroModel);
                //     }                    
                // } else {
                //     this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/parameters/Category" + this._get_i18n("dialog_msg_2_1")).open();
                // }

            },
            getMaterial: async function (deliveryOrder, code, userConnected) {
                var URL = "tmsmanifest/cargo/Material?$filter=(deliveryOrder eq '" + deliveryOrder + "' and item eq '" + code + "' and userMail eq '" + userConnected + "')";
                var oData = {

                };
                let response = await this.requestCAP(URL, oData, 'GET');
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " Delivery Order").open();
                    } else {
                        return response.EX_DATA;
                        // let oModel = new JSONModel(response.EX_DATA);
                        // this.getOwnerComponent().setModel(oModel, Constants.model.centroModel);
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/parameters/Category" + this._get_i18n("dialog_msg_2_1")).open();
                }
            },
            getMaterialsUser: async function (userConnected) {
                var URL = "tmsmanifest/cargo/Material?$filter=("+ "userMail eq '" + userConnected + "')";
                var oData = {

                };
                this.oLoaderData.open();
                let response = await this.requestCAP(URL, oData, 'GET');
                this.oLoaderData.close();
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " Material").open();
                    } else {
                        let array = [];
                        response.EX_DATA.value.forEach(material => {
                            array.push(material.ID)
                        });             
                        this.deleteMaterials(array);
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/parameters/Material" + this._get_i18n("dialog_msg_2_1")).open();
                }
            },
            getLog: async function (code, deliveryOrderCode) {
                var URL = "tmsmanifest/cargo/Log?$filter=item eq '" + code + "' and deliveryOrderCode eq '" + deliveryOrderCode + "'";
                var oData = {

                };
                let response = await this.requestCAP(URL, oData, 'GET');
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " Log").open();
                    } else {                        
                        return response.EX_DATA.value;
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/cargo/Log" + this._get_i18n("dialog_msg_2_1")).open();
                }
            },
            getFreighData: async function (code) {
                var URL = "tmsmanifest/cargo/FreightOrder?$filter=(code eq '"+ code +"')&$expand=package($expand=item($expand=deliveryOrder))";
                var oData = {

                };
                let response = await this.requestCAP(URL, oData, 'GET');
                if (response.EX_RESPONSE == "S") {
                    if (Object.entries(response.EX_DATA).length === 0) {
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_3") + " Log").open();
                    } else {                        
                        return response.EX_DATA.value;
                    }
                } else {
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", this._get_i18n("dialog_msg_2") + "/tmsmanifest/cargo/Log" + this._get_i18n("dialog_msg_2_1")).open();
                }
            },
            postCreateLog: async function (data) {
                var URL = "tmsmanifest/cargo/CreateLog";
                this.oLoaderData.open();
                let response = await this.requestCAP(URL, data, 'POST');
                this.oLoaderData.close();
            },
            postMaterial: async function (data) {
                var URL = "tmsmanifest/cargo/CreateMaterial";
                this.oLoaderData.open();
                let response = await this.requestCAP(URL, data, 'POST');
                this.temps.push(response.EX_DATA.value);
                this.oLoaderData.close();
            },
            deleteMaterial: async function (ID) {
                var URL = "tmsmanifest/cargo/DeleteMaterial";
                var oData = {
                    material_ID: [ID]
                };
                this.temps.splice(this.temps.indexOf(ID), 1)
                this.oLoaderData.open();
                let response = await this.requestCAP(URL, oData, 'POST');
                this.oLoaderData.close();
            },
            deleteMaterials: async function (oData) {
                var URL = "tmsmanifest/cargo/DeleteMaterial";
                this.oLoaderData.open();
                oData = {
                    material_ID: oData
                }
                let response = await this.requestCAP(URL, oData, 'POST');
                this.temps = [];
                this.oLoaderData.close();
            },
            //Funcion encargada de obtener la data (tipo de transportes) desde el servicio de ERP la cual es guardada en un modelo 
            getTransportType: async function () {
                var oController = this;
                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_RESOURCESet";
                var filters = []
                var oData = {};
                oController.oLoaderData.open();
                try {
                    let data = await oController.RequestSAPGETPromise(model, filters, service, oData);
                    if (data[0].EX_RESULTADO_EJECUCION == "S") {
                        //Response Ok
                        let oDataModel = [];
                        let json = {};
                        let EX_RESUID_ANT = "";
                        data.forEach(item => {
                            let EX_RESUID = item["EX_RESUID"];
                            if (EX_RESUID == EX_RESUID_ANT) {
                                json.EX_DIMENSION2 = item["EX_DIMENSION"];
                                json.EX_NOINDIVRES2 = item["EX_NOINDIVRES"].replace(".", ",");
                                json.EX_NOINDIVRES_UNIT2 = item["EX_NOINDIVRES_UNIT"];
                                json.Status = "Success"
                                oDataModel.push(json);
                                json = {}
                            } else {
                                json.EX_RESUID = EX_RESUID;
                                json.EX_NAME = item["EX_NAME"];
                                json.EX_DIMENSION1 = item["EX_DIMENSION"]
                                json.EX_NOINDIVRES = item["EX_NOINDIVRES"].replace(".", ",");
                                json.EX_NOINDIVRES_UNIT = item["EX_NOINDIVRES_UNIT"];
                                EX_RESUID_ANT = EX_RESUID;
                            }
                        });
                        let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_TT.id);
                        let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_TT.tableTransport);
                        oTable.setVisibleRowCount(oDataModel.length);
                        let oModel = new JSONModel(oDataModel);
                        oController.getOwnerComponent().setModel(oModel, Constants.model.transportModel);
                    } else if (data[0].EX_RESULTADO_EJECUCION == "E") {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", data[0].EX_DSC_EJECUCION).open();
                    } else {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                    }
                    oController.oLoaderData.close();
                } catch (e) {
                    oController.oLoaderData.close();
                    //Response Error
                    console.log(e)
                    oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                }
            },
            //Funcion encargada de obtener la data (Guias de despachos) desde el servicio de ERP la cual es guardada en un modelo 
            getMaterialsSRV: async function (IN_WERKS, IN_BUDAT_MKPF_FROM, IN_BUDAT_MKPF_TO, IN_LGORT, IN_LIFNR, IN_SOBKZ) {
                var oController = this;
                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_MATERIAL_DOCSet";
                var filters = [
                    new sap.ui.model.Filter("IN_WERKS", sap.ui.model.FilterOperator.EQ, IN_WERKS),
                    new sap.ui.model.Filter("IN_LIFNR", sap.ui.model.FilterOperator.EQ, IN_LIFNR),
                    new sap.ui.model.Filter("IN_LGORT", sap.ui.model.FilterOperator.EQ, IN_LGORT),
                    new sap.ui.model.Filter("IN_BUDAT_MKPF_FROM", sap.ui.model.FilterOperator.EQ, IN_BUDAT_MKPF_FROM),
                    new sap.ui.model.Filter("IN_BUDAT_MKPF_TO", sap.ui.model.FilterOperator.EQ, IN_BUDAT_MKPF_TO),
                    new sap.ui.model.Filter("IN_SOBKZ", sap.ui.model.FilterOperator.EQ, IN_SOBKZ) //free "" y consig "X"
                ]
                var oData = {};
                try {
                    let data = await oController.RequestSAPGETPromise(model, filters, service, oData);
                    let oHeaderData = await this.getHeaderData();
                    if (data[0].EX_RESULTADO_EJECUCION == "S") {
                        //Response Ok        
                        var oDataModel = [];
                        let json = {};
                        let EX_MBLN_ANT = "";
                        for (let index = 0; index < data.length; index++) {
                            let element = data[index];
                            let EX_MBLN = element["EX_MBLN"];
                            json.deliveryOrder = EX_MBLN;
                            json.provider = element["EX_NAME1"];
                            json.date = element["EX_BUDAT_MKPF"];
                            json.gr = element["EX_XBLNR_MKPF"];
                            json.EX_MJAHR = element["EX_MJAHR"].trim();
                            // json.highlight = "Success"
                            let detail = []
                            let item = {}
                            item.code = element["EX_ZEILE"].trim();
                            item.quantity = parseInt(element["EX_ERFMG"].trim());
                            item.unitMeasure = element["EX_ERFME"].trim();
                            item.price = element["EX_DMBTR"].trim();
                            item.currency = element["EX_WAERS"].trim();
                            item.EX_SAKTO = element["EX_SAKTO"];
                            item.status = false;
                            if (IN_SOBKZ == "X") {
                                item.ceco = this.getOwnerComponent().getModel(Constants.model.centroModel).getProperty("/value/0/parameter/0/value");
                                item.description = element["EX_SGTXT"].trim();
                                item.materialCode = element["EX_MATNR"].trim();
                            } else {
                                item.ceco = element["EX_KOSTL"].trim();
                                if (element["EX_MATNR"].trim() == "") {
                                    item.materialCode = oHeaderData.value[0].parameter.find(parameter => parameter.name == "MATERIAL_FREE_TEXT").value,
                                    item.description = element["EX_TXZ01"].trim();
                                } else { 
                                    item.materialCode = element["EX_MATNR"].trim();
                                    item.description = element["EX_MAKTX"].trim();
                                }
                            }
                            detail.push(item);
                            let elementNext = data[index + 1];
                            if (elementNext != undefined) {
                                while (EX_MBLN == elementNext["EX_MBLN"]) {
                                    item = {};
                                    item.code = elementNext["EX_ZEILE"].trim();
                                    item.quantity = parseInt(elementNext["EX_ERFMG"].trim());
                                    item.unitMeasure = elementNext["EX_ERFME"].trim();
                                    item.price = elementNext["EX_DMBTR"].trim();
                                    item.currency = elementNext["EX_WAERS"].trim();
                                    item.materialCode = elementNext["EX_MATNR"].trim();
                                    item.description = elementNext["EX_SGTXT"].trim();
                                    item.status = false;
                                    item.EX_SAKTO = element["EX_SAKTO"];
                                    if (IN_SOBKZ == "X") {
                                        item.ceco = this.getOwnerComponent().getModel(Constants.model.centroModel).getProperty("/value/0/parameter/0/value");
                                        item.description = elementNext["EX_SGTXT"].trim();
                                        item.materialCode = elementNext["EX_MATNR"].trim();
                                    } else {
                                        item.ceco = elementNext["EX_KOSTL"].trim();
                                        if (elementNext["EX_MATNR"].trim() == "") {
                                            item.materialCode = oHeaderData.value[0].parameter.find(parameter => parameter.name == "MATERIAL_FREE_TEXT").value,
                                            item.description = elementNext["EX_TXZ01"].trim();
                                        } else { 
                                            item.materialCode = elementNext["EX_MATNR"].trim();
                                            item.description = elementNext["EX_MAKTX"].trim();
                                        }
                                    }
                                    detail.push(item);
                                    index++;
                                    if (index + 1 < data.length - 1) {
                                        elementNext = data[index + 1];
                                    } else {
                                        // item = {};
                                        // item.code = elementNext["EX_ZEILE"].trim();
                                        // item.quantity = elementNext["EX_ERFMG"].trim();
                                        // item.unitMeasure = elementNext["EX_ERFME"].trim();
                                        // item.price = elementNext["EX_DMBTR"].trim();
                                        // item.currency = elementNext["EX_WAERS"].trim();
                                        // item.materialCode = elementNext["EX_MATNR"].trim();
                                        // item.description = elementNext["EX_SGTXT"].trim();
                                        // if (IN_SOBKZ == "X") {
                                        //     item.ceco = elementNext["EX_KOSTL"].trim();
                                        // } else {
                                        //     item.ceco = this.getOwnerComponent().getModel(Constants.model.centroModel).getProperty("/value/0/parameter/0/value")
                                        // }
                                        // detail.push(item);
                                        break;
                                    }
                                }
                            }
                            json.detail = detail;
                            oDataModel.push(json);
                            json = {};
                        }
                        let jsonCAP = {
                            userMail: oController.userConnected,
                            deliveryOrders: oDataModel
                        }
                        oDataModel = await oController.postCheckGD(jsonCAP);
                        let oModel = new JSONModel(oDataModel);
                        oController.getOwnerComponent().setModel(oModel, Constants.model.gdModel);
                    } else if (data[0].EX_RESULTADO_EJECUCION == "E") {
                        oController._buildDialog(oController._get_i18n("dialog_information"), "Information", data[0].EX_DSC_EJECUCION).open();
                        let oModel = new JSONModel();
                        oController.getOwnerComponent().setModel(oModel, Constants.model.guideModel);
                        oController.getOwnerComponent().setModel(oModel, Constants.model.gdModel);
                        return "E"
                    } else {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                    }
                } catch (e) {
                    //Response Error
                    console.log(e)
                    oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                }
            },
            // checkGD: async function (oDataModel){
            //     console.log(oDataModel);
                
            //     this.oLoaderData.open();
            //     let oController = this;
            //     for (const GD of oDataModel) {
            //         let response = await oController.getDeliveryOrder(GD.deliveryOrder);
            //         // let oDataLogs = this.getOwnerComponent().getModel(Constants.model.logsModel).getData();
            //         // if (oDataLogs.length > 0 ) {
            //         //     let errors = {}
            //         //     oDataLogs.forEach(log => {
            //         //         if (errors[log.freightOrderCode] != undefined){
            //         //             errors[log.freightOrderCode].push([log.msg, log.step, log.status]);
            //         //         } else {
            //         //             errors[log.freightOrderCode] = [[log.msg, log.step, log.status]]
            //         //         }
            //         //     });
            //         //     for (const key in errors) {
            //         //         if (errors.hasOwnProperty(key)) {
            //         //             const element = errors[key];
            //         //             let freight = await oController.getFreighData(key);
            //         //             freight[0].package.forEach(oPackage => {
            //         //                 oPackage.item.forEach(item => {
            //         //                     if (item.deliveryOrder.code == GD.deliveryOrder){
            //         //                         GD.detail.forEach(itemGD => {
            //         //                             if (itemGD.code == item.code){
            //         //                                 itemGD.status = true;
            //         //                                 oController.errors[GD.deliveryOrder +"-"+ itemGD.code] = element;
            //         //                             }
            //         //                         });
            //         //                     }
            //         //                 });
            //         //             });
                                
            //         //         }
            //         //     }
                        
                        
                        
            //         // }
            //         if (response.value.length > 0) {
            //             let countItems = GD.detail.length;
            //             let count = 0
            //             GD.detail.forEach(item => {
            //                 if (response.value[0].item.find(itemS => itemS.code === item.code) != undefined) {
            //                     item.selected = true;
            //                     item.editable = false;
            //                     count = count + 1;
            //                 }
            //             });
            //             if (count == countItems) {
            //                 GD.status = "processed";
            //                 GD.visible = false;
            //                 GD.highlight = "Error"
            //             }
            //         }
            //         GD.detail.forEach(async item => {
            //             let response = await oController.getMaterial(GD.deliveryOrder, item.code, oController.userConnected);
            //             if (response != undefined) {
            //                 if (response.value.length > 0) {
            //                     item.selected = true;
            //                     item.editable = false;
            //                 }
            //             }
            //         });
            //     };
            //     this.oLoaderData.close();
            //     let oModel = new JSONModel(oDataModel);
            //     oController.getOwnerComponent().setModel(oModel, Constants.model.gdModel);
            // },
            //Funcion encargada de obtener la data (Plantas/centro) desde el servicio de ERP la cual es guardada en un modelo 
            getPlantSRV: async function () {
                var oController = this;
                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_WERKSSet";
                var filters = [
                    new sap.ui.model.Filter("IN_BUKRS", sap.ui.model.FilterOperator.EQ, "CP01"),
                ]
                var oData = {};
                try {
                    let data = await oController.RequestSAPGETPromise(model, filters, service, oData);
                    if (data[0].EX_RESULTADO_EJECUCION == "S") {
                        //Response Ok                        
                        let oModel = new JSONModel(data);
                        oController.getOwnerComponent().setModel(oModel, Constants.model.plantModel);
                    } else if (data[0].EX_RESULTADO_EJECUCION == "E") {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", data[0].EX_DSC_EJECUCION).open();
                    } else {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                    }
                } catch (e) {
                    //Response Error
                    console.log(e)
                    oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                }
            },
            //Funcion encargada de obtener la data (Almacen/StorageLocation) desde el servicio de ERP la cual es guardada en un modelo 
            getStorageLocationSRV: async function (IN_WERKS) {
                var oController = this;
                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_STO_LOCATIONSet";
                var filters = [
                    new sap.ui.model.Filter("IN_WERKS", sap.ui.model.FilterOperator.EQ, IN_WERKS),
                ]
                var oData = {};
                oController.oLoaderData.open();
                try {
                    let data = await oController.RequestSAPGETPromise(model, filters, service, oData);
                    if (data[0].EX_RESULTADO_EJECUCION == "S") {
                        //Response Ok
                        
                        let oModel = new JSONModel(data);
                        oController.getOwnerComponent().setModel(oModel, Constants.model.storageModel);
                        await this.getSourceStorage();
                    } else if (data[0].EX_RESULTADO_EJECUCION == "E") {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", data[0].EX_DSC_EJECUCION).open();
                    } else {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                    }
                    oController.oLoaderData.close();
                } catch (e) {
                    oController.oLoaderData.close();
                    //Response Error
                    console.log(e)
                    oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                }
            },
            //Funcion encargada de obtener la data (Proveedor/Vendor) desde el servicio de ERP la cual es guardada en un modelo 
            getVendorSRV: async function () {
                var oController = this;
                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_SUPPLIERSSet";
                var filters = [
                    new sap.ui.model.Filter("IN_BUKRS", sap.ui.model.FilterOperator.EQ, "CP01"),
                ]
                var oData = {};
                oController.oLoaderData.open();
                try {
                    let data = await oController.RequestSAPGETPromise(model, filters, service, oData);
                    if (data[0].EX_RESULTADO_EJECUCION == "S") {
                        //Response Ok
                        let oModel = new JSONModel(data);
                        oController.getOwnerComponent().setModel(oModel, Constants.model.vendorModel);
                    } else if (data[0].EX_RESULTADO_EJECUCION == "E") {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", data[0].EX_DSC_EJECUCION).open();
                    } else {
                        oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                    }
                    oController.oLoaderData.close();
                } catch (e) {
                    oController.oLoaderData.close();
                    //Response Error
                    console.log(e)
                    oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                }
            },
            postFreightOrder: async function (json, oPackages) {
                var oController = this;
                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_FREIGHT_HEADERSet";
                var filters = []
                var oData = json;
                oController.oLoaderData.open();
                try {                    
                    let data = await oController.RequestSAPPOSTPromise(model, service, oData);
                    console.log(data);
                    let tag = true;
                    let errors = {
                        STO: [],
                        CGR: [],
                        COD: []
                    }
                    let jsonErrors = {
                        logs: []
                    };
                    let msgFinal = "";
                    data.ZTM_CM_FREIGHT_HEADER_RESULT.results.forEach(result => {
                        if (result.EX_STEP != ""){
                            oPackages.forEach(oPackage => {
                                oPackage.item.forEach(item => {
                                    let error = {
                                        status: result.EX_RESULTADO_EJECUCION,
                                        deliveryOrderCode: item.deliveryOrder,
                                        item: item.code,
                                        step: result.EX_STEP,
                                        msg: result.EX_DSC_EJECUCION
                                    };
                                    if (result.EX_STEP == "STO" && result.EX_RESULTADO_EJECUCION == "S") {
                                        msgFinal = oController._get_i18n("dialog_msg_17");
                                    }
                                    jsonErrors.logs.push(error);
                                });
                            });
                        }
                        switch (result.EX_STEP) {
                            case "STO":
                                if (result.EX_RESULTADO_EJECUCION == "E") {
                                    errors.STO.push(result.EX_DSC_EJECUCION);
                                    tag = false;
                                } else if (result.EX_RESULTADO_EJECUCION == "S") {
                                    errors.STO.push(result.EX_DSC_EJECUCION);
                                }                     
                                break;
                            case "CGR":
                                if (result.EX_RESULTADO_EJECUCION == "E") {
                                    errors.CGR.push(result.EX_DSC_EJECUCION);
                                    tag = false;
                                } else if (result.EX_RESULTADO_EJECUCION == "S") {
                                    errors.CGR.push(result.EX_DSC_EJECUCION);
                                }                   
                                break;
                            case "COD":
                                if (result.EX_RESULTADO_EJECUCION == "E") {
                                    errors.COD.push(result.EX_DSC_EJECUCION);
                                    tag = false;
                                } else if (result.EX_RESULTADO_EJECUCION == "S") {
                                    errors.COD.push(result.EX_DSC_EJECUCION);
                                }                   
                                break;
                            default:
                                break;
                        }
                    });
                    if (tag) {
                        let msg = ""
                        for (const key in errors) {
                            if (errors.hasOwnProperty(key) && errors[key].length != 0) {
                                const element = errors[key];
                                msg = msg + oController._get_i18n(key) + ":\n";
                                element.forEach(error => {
                                    msg = msg + "- " + error + "\n";
                                });
                                msg = msg + "\n";
                            } else {
                                msg = msg + oController._get_i18n(key) + ": " + oController._get_i18n("dialog_msg_14") + "\n\n";
                            }
                        }
                        await oController.postCreateLog(jsonErrors);
                        return ["Success", msg];
                    } else {
                        let msg = ""
                        for (const key in errors) {
                            if (errors.hasOwnProperty(key) && errors[key].length != 0) {
                                const element = errors[key];
                                msg = msg + oController._get_i18n(key) + ":\n";
                                element.forEach(error => {
                                    msg = msg + "- " + error + "\n";
                                });
                                msg = msg + "\n";
                            } else {
                                msg = msg + oController._get_i18n(key) + ": " + oController._get_i18n("dialog_msg_14") + "\n\n";
                            }
                        }
                        msg = msg + msgFinal;
                        await oController.postCreateLog(jsonErrors);
                        return ["Error", msg];
                    }
                    oController.oLoaderData.close();
                } catch (e) {
                    oController.oLoaderData.close();
                    //Response Error
                    console.log(e)
                    oController._buildDialog(oController._get_i18n("dialog_error"), "Error", oController._get_i18n("dialog_msg_1") + service).open();
                }
            },
            RequestSAPGETPromise: function (Model, filters, service, oData) {
                return new Promise(function (resolve, reject) {
                    Model.setUseBatch(false);
                    Model.read(service, {
                        filters: [filters],
                        async: false,
                        success: function (oRespon, response) {
                            resolve(oRespon.results);
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    })

                })
            },
            RequestSAPPOSTPromise: function (Model, service, oData) {
                return new Promise(function (resolve, reject) {
                    Model.setUseBatch(false);
                    Model.create(service, oData, {
                        async: true,
                        success: function (oRespon, response) {
                            resolve(oRespon);
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    })
                })
            },
            //DATA DE JSON
            //Funcion encargada de obtener la data (guias de despacho) de un json la cual es guardada en un modelo 
            // loadModel: async function () {
            //     const oResponse = await Services.getLocalJSON(Constants.json.gdd);
            //     const oData = oResponse[0];
            //     //se le agrega dos campos a cada guia del json para saber si ya fue procesado el item
            //     oData.forEach(GD => {
            //         GD.detail.forEach(item => {
            //             item.selected = false;
            //             item.editable = true;
            //         });
            //     });
            //     var oModel = new JSONModel();
            //     oModel.setData(oData);
            //     this.getOwnerComponent().setModel(oModel, Constants.model.gdModel);
            // },
            // loadTransportModel: async function () {
            //     const oResponse = await Services.getLocalJSON(Constants.json.transport);
            //     const oData = oResponse[0];
            //     var oModel = new JSONModel();
            //     oModel.setData(oData);
            //     this.getOwnerComponent().setModel(oModel, Constants.model.transportModel);
            // },
            //-----------------------------------------------------------------------------------

            //--------------------------------->FUNCIONES APP<----------------------------------
            changeCount: function () {
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_TT.id);
                let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_TT.tableTransport);
                let oModel = this.getOwnerComponent().getModel(Constants.model.transportModel);
                let count = 0;
                oTable.getRows().forEach(row => {
                    if (row.getCells()[1].getText() != "") {
                        count = count + 1
                    }
                });
                let flag = true;
                oTable.getColumns().forEach(column => {
                    if (column.getFilterValue() != "") {
                        // oData = oData.filter(function(e) {
                        //     return e["EX_NAME"].includes(column.getFilterValue());
                        // });
                        flag = false
                    }
                })
                if (flag) {
                    oTable.setVisibleRowCount(oModel.getData().length);
                } else {
                    if (count != 0) {
                        oTable.setVisibleRowCount(count);
                    }
                }
            },
            getMaterials: async function (oEvent) {
                this.oLoaderData.open();
                let tabs = this.byId(Constants.ids.mainView.iconTabBar);
                let tag = true;
                if (tabs.getItems()[4].getEnabled() == true) {
                    let header = oEvent.getSource().getProperty("header");
                    this.getMaterialsUser(this.userConnected);
                    this.clearViews(header);
                } else {
                    let toDay = new Date();
                    let firstDayMonth = new Date(toDay.getFullYear(), toDay.getMonth(), 1);
                    let lastDayMonth = new Date(toDay.getFullYear(), toDay.getMonth() + 1, 0);
                    firstDayMonth = this.formatDate(firstDayMonth);
                    lastDayMonth = this.formatDate(lastDayMonth);
                    let header = oEvent.getSource().getProperty("header");
                    let oFilters = {};
                    if (header == this._get_i18n("consignmentMaterials")) {
                        this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property9, "X");
                        // this.getMaterialsSRV("C601", "20190101", lastDayMonth, "", "", "X");
                        oFilters = {
                            EX_WERKS: "C601",
                            IN_BUDAT_MKPF_FROM: "20190101",
                            IN_BUDAT_MKPF_TO: lastDayMonth,
                            EX_LGORT: "",
                            EX_LIFNR: ""
                        }
                        let oModel = new JSONModel();
                        this.getOwnerComponent().setModel(oModel, Constants.model.centroModel);
                    } else {
                        this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property9, "");
                        // this.getMaterialsSRV("C601", firstDayMonth, lastDayMonth, "", "", "");
                        oFilters = {
                            EX_WERKS: "C601",
                            IN_BUDAT_MKPF_FROM: firstDayMonth,
                            IN_BUDAT_MKPF_TO: lastDayMonth,
                            EX_LGORT: "",
                            EX_LIFNR: ""
                        }
                        this.getCentroCosto("C601");
                    }
                    let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_gd.id);
                    let oColumn = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.columnCeco);
                    oColumn.setVisible(false);
                    let oModel = new JSONModel(oFilters);
                    this.getView().setModel(oModel, Constants.model.filterModel);
                    await this.getStorageLocationSRV("C601");
                    this.getVendorSRV();
                    //Se avanza al siguiente proceso de los icontabbar
                    await this.getPlantSRV();
                    this.createFilterHomeDialog();
                    this.oLoaderData.close();
                }
            },
            clearViews: function (header) {
                let that = this;
                let tabs = this.byId(Constants.ids.mainView.iconTabBar);
                MessageBox.confirm(that._get_i18n("dialog_msg_10"), {
                    onClose: async function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            let sFragmentId = that.getView().createId(Constants.ids.icontabfilter_TT.id);
                            let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_TT.tableTransport);
                            oTable.getRows().forEach(row => {
                                row.getCells()[0].setSelected(false);
                            });
                            let oData = {
                                items: []
                            }
                            let oModel = new JSONModel(oData);
                            that.getOwnerComponent().setModel(oModel, Constants.model.palletModel);
                            oData = {
                                pallets: []
                            }
                            oModel = new JSONModel(oData);
                            that.getView().setModel(oModel, Constants.model.orderModel);
                            let toDay = new Date();
                            toDay = that.formatDate(toDay);
                            let oInfo = {
                                typeMaterials: "",
                                pathTransport: "",
                                transport: "",
                                countItems: 0,
                                countPallets: 0,
                                weight: 0,
                                totalWeight: 0,
                                bultos: 0,
                                typeBulto: "",
                                nameT: "Transport TM",
                                plate: "",
                                license: "",
                                startDate: toDay,
                                obs: "",
                                EX_LGORT: "",
                                brand: ""
                            };
                            oModel = new JSONModel(oInfo);
                            that.getView().setModel(oModel, Constants.model.infoModel);
                            that.checkTypeTransport(0);
                            let count = 0;
                            tabs.getItems().forEach(tab => {
                                if (count % 2 == 0 && count >= 2) {
                                    tab.setEnabled(false);
                                }
                                count++;
                            });
                            toDay = new Date();
                            let firstDayMonth = new Date(toDay.getFullYear(), toDay.getMonth(), 1);
                            let lastDayMonth = new Date(toDay.getFullYear(), toDay.getMonth() + 1, 0);
                            firstDayMonth = that.formatDate(firstDayMonth);
                            lastDayMonth = that.formatDate(lastDayMonth);
                            let oFilters = {};
                            if (header == that._get_i18n("consignmentMaterials")) {
                                that.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property9, "X");
                                // that.getMaterialsSRV("C601", "20190101", lastDayMonth, "", "", "X");
                                oFilters = {
                                    EX_WERKS: "C601",
                                    IN_BUDAT_MKPF_FROM: "20190101",
                                    IN_BUDAT_MKPF_TO: lastDayMonth,
                                    EX_LGORT: "",
                                    EX_LIFNR: ""
                                }
                                let sFragmentId = that.getView().createId(Constants.ids.icontabfilter_gd.id);
                                let oColumn = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.columnCeco);
                                oColumn.setVisible(false);
                                let oModel = new JSONModel();
                                that.getOwnerComponent().setModel(oModel, Constants.model.centroModel);

                            } else {
                                that.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property9, "");
                                // that.getMaterialsSRV("C601", firstDayMonth, lastDayMonth, "", "", "");
                                oFilters = {
                                    EX_WERKS: "C601",
                                    IN_BUDAT_MKPF_FROM: firstDayMonth,
                                    IN_BUDAT_MKPF_TO: lastDayMonth,
                                    EX_LGORT: "",
                                    EX_LIFNR: ""
                                }
                                that.getCentroCosto("C601");
                            }
                            oModel = new JSONModel(oFilters);
                            that.getView().setModel(oModel, Constants.model.filterModel);
                            that.oLoaderData.open();
                            await that.getStorageLocationSRV("C601");
                            that.getVendorSRV();
                            let tab = that.byId(Constants.ids.mainView.iconTabBar);
                            //Se avanza al siguiente proceso de los icontabbar
                            await that.getPlantSRV();
                            await that.createFilterHomeDialog();
                            oModel = new JSONModel();
                            that.getOwnerComponent().setModel(oModel, Constants.model.gdModel);
                            that.oLoaderData.close();

                        }
                    }
                });
            },
            //Esta funcion ocurre al momento de cambiar la seleccion en la lista de Guias de despacho
            //para asi guardar en el modelo guideModel la guia actualmente seleccionada 
            selectGD: function (oEvent) {
                let oBindingContext = oEvent.getSource().getSelectedItem().getBindingContext(Constants.model.gdModel);
                let oModel = this.getOwnerComponent().getModel(Constants.model.gdModel);
                let oGDSeleccionado = oModel.getProperty(oBindingContext.getPath());
                this.getOwnerComponent().getModel(Constants.model.guideModel).setData(oGDSeleccionado);
                this.validateSelected();
            },
            //Funcion que verifica que solo se seleccione un tipo de transporte y guarda en caso de seleccionar uno
            checked: function (oEvent) {
                let check = oEvent.getSource().getSelected();
                let oBindingContext = oEvent.getSource().getBindingContext(Constants.model.transportModel);
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_TT.id);
                let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_TT.tableTransport);
                let oButton = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_TT.buttonAccept);
                let tabs = this.byId(Constants.ids.mainView.iconTabBar);
                if (check) {
                    //Se recorre los items de la tabla para limpiar los checkbox y que solo hay auno seleccionado
                    oTable.getRows().forEach(row => {
                        if (row.getCells()[0].getSelected() == true && row.getCells()[0].getBindingContext(Constants.model.transportModel) != oBindingContext) {
                            row.getCells()[0].setSelected(false);
                        }
                    });
                    this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property8, oBindingContext.getPath());
                    oButton.setVisible(true);

                } else {
                    oButton.setVisible(false);
                    let count = 0;
                    tabs.getItems().forEach(tab => {
                        if (count % 2 == 0 && count >= 4) {
                            tab.setEnabled(false);
                        }
                        count++;
                    });
                }
            },
            //Funcion que se usa para la busqueda en la lista de guias de despacho, la cual busca tanto por EX_NAME1 (filter1),
            //numero_guia (filter2) y EX_BUDAT_MKPF de la guia (filter3)
            onSearch: function (oEvent) {
                let aFilters = [];
                let sQuery = oEvent.getSource().getValue();
                if (sQuery && sQuery.length > 0) {
                    let filter = new Filter(Constants.filters.filter1, FilterOperator.Contains, sQuery);
                    aFilters.push(filter)
                    filter = new Filter(Constants.filters.filter2, FilterOperator.Contains, sQuery);
                    aFilters.push(filter)
                    filter = new Filter(Constants.filters.filter3, FilterOperator.Contains, sQuery);
                    aFilters.push(filter)
                    aFilters = new Filter(aFilters, false);
                }
                // Actualizamos los filter en la list 
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_gd.id);
                let oList = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.list);
                let oBinding = oList.getBinding("items");
                oBinding.filter(aFilters, "Application");
            },
            //Funcion que añade los items seleccionados de una guia al bulto que se esta creando
            add: function () {
                //Tabla de items de una guia
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_gd.id);
                let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.table);
                //Items Seleccionados de un guia
                let palletModel = oTable.getSelectedItems();
                let oModel = this.getOwnerComponent().getModel(Constants.model.guideModel);
                let itemsAceptados = [];
                let that = this;

                //Añdimos los items al bulto que se esta guardando en palletModel
                palletModel.forEach(item => {
                    if (item.getMultiSelectControl().getEditable()) {
                        let oItem = oModel.getProperty(item.getBindingContext(Constants.model.guideModel).getPath());
                        let count = 0
                        //Actualizamos el atributo selected y editable de cada item en el modelo gdModel (dejarlos procesados) 
                        oModel.getData().detail.forEach(detailGuide => {
                            if (oItem == detailGuide) {
                                detailGuide.selected = true;
                                detailGuide.editable = false;
                                let oList = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.list);
                                let path = oList.getSelectedItem().getBindingContext(Constants.model.gdModel).getPath();
                                that.getView().getModel(Constants.model.gdModel).setProperty(path + "/detail/" + count, detailGuide);
                            }
                            count = count + 1;
                        });
                        //Añadimos al item 3 propiedades que eran de su guia para asi cuando se añada al bulto identificar
                        //de que Guia provenia 
                        oItem.EX_MJAHR = oModel.getProperty(Constants.properties.guideModel.property5);
                        oItem.deliveryOrder = oModel.getProperty(Constants.properties.guideModel.property1);
                        oItem.provider = oModel.getProperty(Constants.properties.guideModel.property2);
                        oItem.date = oModel.getProperty(Constants.properties.guideModel.property3);
                        oItem.type = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property9);
                        //Obtenemos el modelo que contendra todos los items que queremos añadir
                        let oItemsModel = that.getView().getModel(Constants.model.palletModel);
                        //Ahora obtenemos la data del modelo la cual tiene en items un arreglo de items, y a este le añadiremos
                        //los nuevos items que se desean agregar
                        let oData = oItemsModel.getData();
                        oData.items.push(oItem);
                        oItemsModel.setData(oData);
                        //Ademas guardamos en un arreglo todos los items que fueron agregados
                        itemsAceptados.push(oItem);
                    }
                });
                //Desabilitamos la opcion de selecionar de todos los items que fueron seleccionados
                oTable.getSelectedItems().forEach(item => {
                    item.getMultiSelectControl().setEditable(false)
                });
                //Y ademas desabilitamos la opcion de seleccionar todos los items en caso de que se seleccionen todos los items
                //TO DO: debemos revisar el caso en que el "allSelected" debe ser desabilitado con que solo uno este seleccionado
                if (oTable.getItems().length == oTable.getSelectedItems().length) {
                    oTable._getSelectAllCheckbox().setEditable(false)
                }
                //Creamos un mensaje de cuantos items fueron agregados
                if (itemsAceptados.length > 0) {
                    let msgSuccess = + itemsAceptados.length;
                    MessageToast.show(msgSuccess + ' items were added.');
                }
                itemsAceptados.forEach(item => {
                    let dataItem = { 
                        material: {
                            deliveryOrder: item.deliveryOrder,
                            item: item.code,
                            userMail:  this.userConnected
                        } 
                    }
                    that.postMaterial(dataItem);
                });
                //Actualizamos la cantidad de items que se añadieron en el bulto
                let count = itemsAceptados.length
                let sumaCount = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property1) + count;
                this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property1, sumaCount);
                sFragmentId = this.getView().createId(Constants.ids.icontabfilter_bulto.id);
                let oButtonCreate = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_bulto.buttonCreate);
                let oButtonDelete = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_bulto.buttonDelete);
                oButtonCreate.setVisible(true);
                oButtonDelete.setVisible(true);
            },

            //Funcion que muestra la columna con la opcion de eliminar los items
            delete: function (oEvent) {
                //Boton que habilita o desabilita la eliminacion de un item
                let button = oEvent.getSource();
                //Columna que tiene que aparecer o desaparecer segun corresponda
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_bulto.id);
                let column = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_bulto.columnAction);
                //Obtenemos los textos que deberan cambiar en el boton
                let enableText = this.getOwnerComponent().getModel(Constants.model.I18N).getResourceBundle().getText(Constants.properties.i18n.property1);
                let disableText = this.getOwnerComponent().getModel(Constants.model.I18N).getResourceBundle().getText(Constants.properties.i18n.property2);
                //Cuando la opcion de Eliminar esta Desabilitada
                if (button.getText() == enableText) {
                    column.setVisible(true)
                    button.setText(disableText)
                    //Cuando la opcion de Eliminar esta Habilitada
                } else {
                    column.setVisible(false)
                    button.setText(enableText)
                }
            },
            //Funcion que elimina un item del bulto que se esta creando
            deleteGD: async function (oEvent) {
                //Obtenemos del boton su contendor con el getParent() que seria la fila completa de la tabla (el item)
                let row = oEvent.getSource().getParent();
                //Modelo que contiene los items del bulto que crearemos
                let oPalletModel = this.getView().getModel(Constants.model.palletModel);
                //Modelo que contiene las guias de despachos
                let oGDModel = this.getView().getModel(Constants.model.gdModel);
                //Obtenemos el path del item que eliminaran para luego seleccionarlo del modelo 
                let path = row.getBindingContext(Constants.model.palletModel).getPath();
                let itemDelete = oPalletModel.getProperty(path);
                //Del item obtenemos el deliveryOrder para identificar de que guia proviene y desbloquear su uso para agregarlo en otro bulto posteriormente
                let nGuide = itemDelete.deliveryOrder;
                this.oLoaderData.open();
                let response = await this.getMaterial(itemDelete.deliveryOrder, itemDelete.code, this.userConnected);
                this.oLoaderData.close();
                await this.deleteMaterial(response.value[0].ID)
                let guide = oGDModel.getData().find(guide => guide.deliveryOrder == nGuide);
                //Obtenemos el item original que viene del modelo GD
                let item = guide.detail.find(item => item.code == itemDelete.code);
                //Obtenemos los index del item y la guia para luego setear el selected y editable del item para que ya no este bloqueado
                let indexItem = guide.detail.findIndex(item => item.code == itemDelete.code);
                let indexGuide = oGDModel.getData().findIndex(guide => guide.deliveryOrder == nGuide)
                oGDModel.setProperty("/" + indexGuide + "/detail/" + indexItem + "/selected", false)
                oGDModel.setProperty("/" + indexGuide + "/detail/" + indexItem + "/editable", true)
                //Ademas revisamos si tenemos que habilitar el all select de la tabla
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_gd.id);
                let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.table);
                if (oTable.getItems().length == oTable.getSelectedItems().length) {
                    oTable._getSelectAllCheckbox().setEditable(false)
                } else {
                    oTable._getSelectAllCheckbox().setEditable(true)
                }
                //Obtenemos el indice del la fila que deseamos borrar para luego sacar el item con ese indice del array que se encuentra dentro del palletmodel
                let indice = parseInt(row.getIdForLabel().split("-")[10]);
                let arrayItems = oPalletModel.getData().items;
                arrayItems.splice(indice, 1);
                oPalletModel.setProperty(Constants.properties.palletModel.property1, arrayItems);
                //Actualizamos el contador de items del Bulto
                let sumaCount = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property1) - 1;
                this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property1, sumaCount);
                sFragmentId = this.getView().createId(Constants.ids.icontabfilter_bulto.id);
                oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_bulto.tableItems);
                if (oTable.getItems().length == 0) {
                    let oButtonCreate = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_bulto.buttonCreate);
                    let oButtonDelete = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_bulto.buttonDelete);
                    oButtonCreate.setVisible(false);
                    oButtonDelete.setVisible(false);
                }
            },
            //Funcion que se activa cuando se cambia la seleccion del IconTabBar pero solo se cumple cuando se cambia hacia la GD
            unselectGD: function (oEvent) {
                if (oEvent.getParameters().key == Constants.model.gdModel) {
                    let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_gd.id);
                    let oList = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.list);
                    if (oList.getSelectedItem() != undefined) {
                        oList.getSelectedItem().setSelected(false);
                        let oModel = new JSONModel();
                        this.getOwnerComponent().setModel(oModel, Constants.model.guideModel);
                        let oData = {
                            items: []
                        }
                    }
                }
            },
            //Funcion que se activa cuando se actualiza la tabla de items, es decir, cuando se selecciona una GD de la lista. Con esto se validara el estado de editable
            //de cada item de la guia que se seleccione
            validateSelected: function () {
                //revisar error de repetido el primer item

                //Tabla de items de una guia
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_gd.id);
                let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.table);
                //Hacemos un recorrido por cada item que se encuentre en la tabla
                oTable.getItems().forEach(item => {
                    //Obtenemos el path del item
                    let pathItem = item.getBindingContext(Constants.model.guideModel).getPath();
                    //Modelo que contiene las GD y la lista que contiene las GD
                    let oGuideModel = this.getView().getModel(Constants.model.gdModel);
                    let oList = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.list);
                    //Obtenemos el path de la GD seleccionada
                    let pathGD = oList.getSelectedContextPaths()[0]
                    //Juntando el path de la gd y el del item podemos acceder al item de la GD y asi obtener su estado editable
                    let editable = oGuideModel.getProperty(pathGD + pathItem + "/editable");
                    //Entonces si editable es false y entra en la condicional significa que este item no puede ser editable
                    if (editable == false) {
                        //Revisamos si el item esta selccionado
                        if (item.getSelected()) {
                            //Y cambiamos el estado de editable para que no pueda deseleccionar el item 
                            item.getMultiSelectControl().setEditable(false);
                            // let cb = item.$().find('.sapMCb');
                            // let oCb = sap.ui.core.Fragment.byId(sFragmentId, cb.attr('id'));
                            // oCb.setEditable(false);
                            // item.getMultiSelectControl().setEditable(false)
                        } else { //revisar este caso, no se si sigue siendo necesario
                            if (item.getMultiSelectControl() != undefined) {
                                item.getMultiSelectControl().setEditable(true)
                            }
                        }
                        //En el caso que editable sea true signifca que debemos permitir la edicion de la seleccion del item
                    } else {
                        if (item.getMultiSelectControl() != undefined) {
                            item.getMultiSelectControl().setEditable(true)
                        }
                    }
                });
                //Revisamos si debemos bloquear el all selected de la tabla
                if (oTable.getSelectedItems().length > 0) {
                    oTable._getSelectAllCheckbox().setEditable(false)
                } else {
                    oTable._getSelectAllCheckbox().setEditable(true)
                }
            },
            //Funcion que abre el dialgo de para crear un bulto donde se pedira los datos del peso de este
            createPallet: async function () {
                this.oLoaderData.open();
                await this.getTargetStorage();
                this.oLoaderData.close();
                //Llamamos a la funcion que creara el dialogo y nos lo retornara y asi podremos abrirlo
                this.createDialogs(Constants.dialogs.dialog1.name, Constants.dialogs.dialog1.id, Constants.dialogs.dialog1.route).open();
            },
            //Funcion que abre el dialgo para filtrar las guias de despacho
            createFilterDialog: function () {
                //Llamamos a la funcion que creara el dialogo y nos lo retornara y asi podremos abrirlo
                this.createDialogs(Constants.dialogs.dialog2.name, Constants.dialogs.dialog2.id, Constants.dialogs.dialog2.route).open();
            },
            //Funcion que abre el dialgo para filtrar al inicio las guias de despacho
            createFilterHomeDialog: function () {
                //Llamamos a la funcion que creara el dialogo y nos lo retornara y asi podremos abrirlo
                this.createDialogs(Constants.dialogs.dialog3.name, Constants.dialogs.dialog3.id, Constants.dialogs.dialog3.route).open();
            },
            //Funcion que crea los dialogos, se le debe entregar el nombre del dialogo, el id y su respectiva ruta
            createDialogs: function (sDialogFragmentName, id, route) {
                //Variable que contendra el dialogo que creemos
                var oDialog;
                //Dialogs fue definido anteriormente el cual es un arreglo de dialogos, obtenemos el dialogo en base al nombre que nos entregaron como parametro
                oDialog = this.Dialogs[sDialogFragmentName];
                //Si NO existe , crea un nuevo dialogo
                if (!oDialog) {
                    oDialog = sap.ui.xmlfragment(id, route, this);
                    this.getView().addDependent(oDialog);
                    this.Dialogs[sDialogFragmentName] = oDialog;
                }
                //y en caso de existir solo se le asigna a la variable creada para contener el dialog que se este usando actualmente
                this.Dialog = oDialog;
                return oDialog;
            },
            //Funcion que cierra el dialog que actualmente se encuentre usando
            closeDialog: function () {
                this.Dialog.close()
            },

            //Funcio del Dialogo weight.fragment.xml
            //Se activa cuando guardas el peso del bulto que se esta creando 
            saveWeight: function () {
                //Obtenemos los items del Bulto que se esta creando 
                let detail = this.getOwnerComponent().getModel(Constants.model.palletModel).getProperty(Constants.properties.palletModel.property1);
                //y codigo que usaremos para identificar el nuevo bulto
                let cod = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property2);
                //Creamos una variable que contendra la estructura del nuevo bulto
                let newBulto = {
                    code: (cod + 1).toString(),
                    item: detail
                };
                //Obtenemos los datos que se ingresaron en el dialogo y el peso total que hay actualmente en el camion que se guardaron en el infoModel
                let totalWeight = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property3);
                let weight = parseFloat(this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property5));
                let maxWeight = parseInt(this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property7));
                let typeBulto = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property10);
                let target = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property12);
                let bultos = parseInt(this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property11));
                let source = this.getView().getModel(Constants.model.filterModel).getProperty(Constants.properties.filterModel.property1);
                let dataStorage = this.getOwnerComponent().getModel(Constants.model.storageModel).getData();
                // dataStorage.forEach(storage => {
                //     if (storage.EX_LGORT == source){
                //         source = storage.EX_LGOBE;
                //     }
                // });
                //Aqui verificamos si el peso que se quiere ingresar hace que superemos el limite de peso del camion, si esto no sucede se crea el bulto
                if (totalWeight + weight <= maxWeight) {
                    if (weight > 0 && typeBulto != "" && target != "" && target != source && bultos > 0) {
                        //Obtenemos del OrderModel la propiedad pallets que contiene un arreglo de pallets
                        dataStorage.forEach(storage => {
                            if (storage.EX_LGORT == target){
                                target = storage.EX_LGOBE;
                            }
                        });
                        let aPallets = this.getView().getModel(Constants.model.orderModel).getProperty(Constants.properties.orderModel.property1);
                        newBulto.weight = weight.toString();
                        newBulto.quantityItem = parseInt(newBulto.item.length);
                        newBulto.type = typeBulto;
                        newBulto.targetStorageLocation = target;
                        newBulto.quantity = parseInt(bultos);
                        //A este arreglo le añadimos el nuevo bulto
                        aPallets.push(newBulto);
                        //Y actalizamos el modelo con el nuevo array
                        this.getView().getModel(Constants.model.orderModel).setProperty(Constants.properties.orderModel.property1, aPallets);
                        //Ahora limpiamos el modelo que contenia el nuevo Bulto para asi poder permitir crear otro bulto
                        let oData = {
                            items: []
                        }
                        let oModel = new JSONModel(oData);
                        this.getOwnerComponent().setModel(oModel, Constants.model.palletModel);
                        //Obtenemos el IconTabBar para poder pasar a la siguiente parte del proceso, seteando en el selectedKey el siguiente proceso
                        let tab = this.byId(Constants.ids.mainView.iconTabBar);
                        tab.setSelectedKey(Constants.model.orderModel);
                        //Cerramos el dialogo
                        this.closeDialog()
                        //Actualizamos el contador de Pallets
                        let countPallets = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property2);
                        this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property2, parseInt(countPallets) + 1);
                        //Como se limpio el modelo de palletModel ahora el contador de items del nuevo bulto debe reiniciarse y tambien el peso y unidad de medida del dialogo
                        this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property1, 0);
                        this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property5, 0);
                        this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property10, "");
                        this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property11, 0);
                        //Actulizamos el nuevo peso total que lleva el camion
                        this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property3, totalWeight + weight);
                        this.checkTypeTransport(totalWeight + weight);
                        let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_order.id);
                        let oButtonClose = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_order.buttonClose);
                        oButtonClose.setVisible(true);
                        sFragmentId = this.getView().createId(Constants.ids.icontabfilter_bulto.id);
                        let oButtonCreate = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_bulto.buttonCreate);
                        let oButtonDelete = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_bulto.buttonDelete);
                        oButtonCreate.setVisible(false);
                        oButtonDelete.setVisible(false);
                    } else {
                        let msg = ""
                        if (bultos <= 0) {
                            msg = msg + this._get_i18n("dialog_msg_7") + "\n";
                        } else if (isNaN(bultos)) {
                            msg = msg + this._get_i18n("dialog_msg_6") + "\n"
                        }
                        if (typeBulto == "") {
                            msg = msg + this._get_i18n("dialog_msg_8") + "\n";
                        }
                        if (target == "") {
                            msg = msg + this._get_i18n("dialog_msg_11") + "\n";
                        }
                        if (target == source) {
                            msg = msg + this._get_i18n("dialog_msg_12") + "\n";
                        }
                        if (weight <= 0) {
                            msg = msg + this._get_i18n("dialog_msg_5") + "\n";
                        }
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", msg).open();
                    }
                    //sino se lanza un error y no se guarda el bulto
                } else {
                    if (isNaN(weight)) {
                        let msg = ""
                        if (bultos <= 0) {
                            msg = msg + this._get_i18n("dialog_msg_7") + "\n";
                        } else if (isNaN(bultos)) {
                            msg = msg + this._get_i18n("dialog_msg_6") + "\n"
                        }
                        if (typeBulto == "") {
                            msg = msg + this._get_i18n("dialog_msg_8") + "\n";
                        }
                        if (target == "") {
                            msg = msg + this._get_i18n("dialog_msg_11") + "\n";
                        }
                        if (target == source) {
                            msg = msg + this._get_i18n("dialog_msg_12") + "\n";
                        }
                        msg = msg + this._get_i18n("dialog_msg_9") + "\n"
                        this._buildDialog(this._get_i18n("dialog_error"), "Error", msg).open();
                    } else {
                        //TODO: Definir mensaje en español e ingles si es que se necesita
                        MessageBox.error("You have surpassed the limit of " + maxWeight + " KG. \n" +
                            "There is : " + Math.round(((totalWeight + weight) - maxWeight), -3) + " extra KG");
                    }
                }
            },

            checkTypeTransport: function (totalWeight) {
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_TT.id);
                let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_TT.tableTransport);
                let weightNow = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property3)
                oTable.getRows().forEach(item => {
                    let weight = parseFloat(item.getCells()[2].getText().trim().split(" ")[0]);
                    if (weight < weightNow) {
                        item.getCells()[0].setEditable(false);
                        let path = item.getBindingContext(Constants.model.transportModel).getPath();
                        this.getOwnerComponent().getModel(Constants.model.transportModel).setProperty(path + Constants.properties.transportModel.property1, "Error")
                    } else {
                        item.getCells()[0].setEditable(true);
                        let path = item.getBindingContext(Constants.model.transportModel).getPath();
                        this.getOwnerComponent().getModel(Constants.model.transportModel).setProperty(path + Constants.properties.transportModel.property1, "Success")
                    }
                });
            },

            //Funcion que creara la orden de envio
            //TODO: debemos redifinir esta funcion con los nuevos requerimientos
            createOrder: async function () {
                let that = this;
                MessageBox.confirm(that._get_i18n("dialog_msg_16"), {
                    onClose: async function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            let oInfoData = that.getView().getModel(Constants.model.infoModel).getData();
                            let codeFreight = Math.trunc(Math.round(Math.random() * (9999999 - 1) + 1));
                            let freightOrder = that.getView().getModel(Constants.model.orderModel).getData();
                            let source = that.getView().getModel(Constants.model.filterModel).getProperty(Constants.properties.filterModel.property1);
                            let json = await that.createBody();
                            console.log(json);
                            let status = await that.postFreightOrder(json, freightOrder.pallets);
                            if (status[0] == "Success") {
                                freightOrder.pallets.forEach(pallet => {
                                    pallet.item.forEach(item => {
                                        delete item["selected"];
                                        delete item["editable"];
                                        delete item["status"];
                                        delete item["EX_SAKTO"];
                                        delete item["EX_MJAHR"];
                                    });
                                });
                                let jsonCAP = {
                                    driver: {
                                        name: oInfoData.nameT,
                                        license: oInfoData.license,
                                    },
                                    vehicle: {
                                        plate: oInfoData.plate,
                                        weight: oInfoData.transport.EX_NOINDIVRES.replace(",",".").trim(),
                                        type: oInfoData.transport.EX_NAME,
                                        brand: oInfoData.brand
                                    },
                                    freightOrder: {
                                        code: codeFreight.toString(),
                                        date: oInfoData.startDate,
                                        status: "Success",
                                        observations: oInfoData.obs,
                                        quantityPackage: parseInt(oInfoData.countPallets),
                                        totalWeight: oInfoData.totalWeight.toString(),
                                        sourceStorageLocation: source,
                                        package: freightOrder.pallets,                        
                                    }
                                };
                                console.log(jsonCAP);
                                await that.postCreateFreightOrder(jsonCAP);
                                that._buildDialogFinish(that._get_i18n("dialog_success"), "Success", status[1]).open();
                            } else {
                                that._buildDialogFinish(that._get_i18n("dialog_error"), "Error", status[1]).open();
                            }
                        } 
                    }
                });
            },

            filterGD: async function () {
                var that = this;
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_gd.id);
                let oSwitch = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.idSwitchProcessed);
                oSwitch.setState(false)
                if (that._validaFiltros().length > 0) {
                    that._buildDialog(that._get_i18n("dialog_error"), "Error", that._get_i18n("dialog_msg_4") + " \n" + that._validaFiltros()).open();
                } else {
                    let oData = this.getView().getModel(Constants.model.filterModel).getData();
                    let sTypeGD = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property9);
                    this.oLoaderData.open();
                    await this.getCentroCosto(oData.EX_WERKS);
                    let response = await this.getMaterialsSRV(oData.EX_WERKS, oData.IN_BUDAT_MKPF_FROM, oData.IN_BUDAT_MKPF_TO, oData.EX_LGORT, oData.EX_LIFNR, sTypeGD);
                    let oModel = new JSONModel();
                    this.getOwnerComponent().setModel(oModel, Constants.model.guideModel);
                    this.oLoaderData.close();
                    if (response != "E") {
                        this.closeDialog();
                    }
                }
            },
            filterHomeGD: async function () {
                let tab = this.byId(Constants.ids.mainView.iconTabBar);
                let oStorages = this.getOwnerComponent().getModel(Constants.model.storageModel).getData();
                let sSource = this.getView().getModel(Constants.model.filterModel).getProperty(Constants.properties.filterModel.property1);
                oStorages.forEach(storage => {
                    if (storage.EX_LGORT == sSource) {
                        storage.enable = false;
                    }
                });
                tab.getItems()[2].setEnabled(true);
                tab.setSelectedKey(Constants.model.transportModel);
                this.closeDialog();
            },
            _validaFiltros: function () {
                var that = this;
                var msg = "";
                let oData = this.getView().getModel(Constants.model.filterModel).getData();
                var EX_WERKS = oData.EX_WERKS
                var EX_LGORT = oData.EX_LGORT
                var IN_BUDAT_MKPF_FROM = oData.IN_BUDAT_MKPF_FROM;
                var IN_BUDAT_MKPF_TO = oData.IN_BUDAT_MKPF_TO;

                if (EX_WERKS == "") {
                    msg = msg + "-" + that._get_i18n("plant") + "\n";
                }
                if (EX_LGORT == "") {
                    msg = msg + "-" + that._get_i18n("storageLocation") + "\n";
                }
                if (IN_BUDAT_MKPF_FROM == "") {
                    msg = msg + "-" + that._get_i18n("fromDate") + "\n";
                }
                if (IN_BUDAT_MKPF_TO == "") {
                    msg = msg + "-" + that._get_i18n("toDate") + "\n";
                }
                return msg;
            },

            //Funcion que se activa al momento que se actualiza la tabla de bultos en Orden de envio
            refresh: function () {
                let tab = this.byId("idIconTabBarMulti");
                if (tab.getSelectedKey() == Constants.model.orderModel) {
                    tab.setSelectedKey(Constants.model.gdModel);
                    tab.setSelectedKey(Constants.model.orderModel);
                }
            },
            //Funcion que se activa al confirmar el tipo de transporte, seteando los datos del camion y validacion del peso maximo 
            confirmTransport: function (oEvent) {
                let oModel = this.getOwnerComponent().getModel(Constants.model.transportModel);
                let sPath = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property8);
                let oTransportSelected = oModel.getProperty(sPath);
                this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property6, oTransportSelected);
                let tabs = this.byId(Constants.ids.mainView.iconTabBar);
                this.getPlantSRV();
                //Se avanza al siguiente proceso de los icontabbar
                tabs.setSelectedKey(Constants.model.gdModel);
                let count = 0;
                tabs.getItems().forEach(tab => {
                    if (count % 2 == 0) {
                        tab.setEnabled(true);
                    }
                    count++;
                });
                this.filterGD();
            },

            cerrarOrder: function () {
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_infoT.id);
                let oButtonComplete = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_infoT.buttonComplete);
                oButtonComplete.setEnabled(true);
                let tab = this.byId(Constants.ids.mainView.iconTabBar);
                tab.setSelectedKey(Constants.model.infoTModel);
            },

            getStorageLocation: function (oEvent) {
                this.getView().getModel(Constants.model.filterModel).setProperty(Constants.properties.filterModel.property1, "");
                this.getView().getModel(Constants.model.filterModel).setProperty(Constants.properties.filterModel.property2, "");
                let IN_WERKS = oEvent.getParameters().selectedItem.getKey();
                this.getStorageLocationSRV(IN_WERKS);
                this.getVendorSRV();
            },
            handleLiveChange: function (oEvent) {
                var oTextArea = oEvent.getSource(),
                    iValueLength = oTextArea.getValue().length,
                    iMaxLength = oTextArea.getMaxLength(),
                    sState = iValueLength > iMaxLength ? "Error" : "None";

                oTextArea.setValueState(sState);
            },
            createBody: async function () {
                this.oLoaderData.open();
                let oHeaderData = await this.getHeaderData();
                let freightOrder = this.getView().getModel(Constants.model.orderModel).getData();
                let deliveryOrders = [];
                freightOrder.pallets.forEach(oPackage => {
                    oPackage.item.forEach(item => {
                        deliveryOrders.push(item.deliveryOrder);
                    });                   
                });
                let countPackage = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property2);
                const dataArr = new Set(deliveryOrders);
                let result = [...dataArr];
                let IN_LINE_NUMBER_MD = result.length / oHeaderData.value[0].parameter.find(parameter => parameter.name == "LINE_NUMBER_MD").value;
                IN_LINE_NUMBER_MD = Math.ceil(IN_LINE_NUMBER_MD);
                let oBody = {
                    IN_PACKAGE: "1",
                    IN_COMP_CODE: oHeaderData.value[0].parameter.find(parameter => parameter.name == "COMP_CODE").value,
                    IN_DOC_TYPE: oHeaderData.value[0].parameter.find(parameter => parameter.name == "DOC_TYPE").value,
                    IN_PURCH_ORG: oHeaderData.value[0].parameter.find(parameter => parameter.name == "PURCH_ORG").value,
                    IN_PUR_GROUP: oHeaderData.value[0].parameter.find(parameter => parameter.name == "PUR_GROUP").value,
                    IN_SUPPL_PLNT: oHeaderData.value[0].parameter.find(parameter => parameter.name == "SUPPL_PLNT").value,
                    IN_MATERIAL_FREE_TEXT: oHeaderData.value[0].parameter.find(parameter => parameter.name == "MATERIAL_FREE_TEXT").value,
                    IN_COST_CENTER_CONS: "",
                    IN_SHIP_POINT: oHeaderData.value[0].parameter.find(parameter => parameter.name == "SHIP_POINT").value,
                    IN_LINE_NUMBER_MD: IN_LINE_NUMBER_MD.toString(),
                    IN_PACKAGE_QUANTITY: countPackage.toString(),
                    IN_MJAHR: "",
                    EX_RESULTADO_EJECUCION: "",
                    EX_DSC_EJECUCION: "",
                    EX_USR_EJECUCION: "",
                    ZTM_CM_FREIGHT_HEADER_POSITION: this.createItems(freightOrder, oHeaderData.value[0].parameter.find(parameter => parameter.name == "LINE_NUMBER_MD").value, oHeaderData.value[0].parameter.find(parameter => parameter.name == "MATERIAL_FREE_TEXT").value),
                    ZTM_CM_FREIGHT_HEADER_RESULT: [
                        {
                            IN_PACKAGE: "",
                            EX_RESULTADO_EJECUCION: "",
                            EX_DSC_EJECUCION: "",
                            EX_USR_EJECUCION: "",
                            EX_STEP: "",
                            EX_TYPE: "",
                            EX_ID: "",
                            EX_NUMBER: "",
                            EX_MESSAGE_V1: "",
                            EX_MESSAGE_V2: ""
                        }
                    ]
                };
                this.oLoaderData.close();
                return oBody;
            },
            createItems: function (oData, corte, MATERIAL_FREE_TEXT) {
                let items = [];
                let count = "10";
                let IN_PLANT = this.getView().getModel(Constants.model.filterModel).getProperty(Constants.properties.filterModel.property3);
                let IN_SUPPL_STLOC = this.getView().getModel(Constants.model.filterModel).getProperty(Constants.properties.filterModel.property1);
                let IN_ACCTASSCAT = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property9) == "X" ? "K" : "";
                let IN_OUTBOUND_DELIVERY = 1;
                let deliveryOrderAnt = "";
                let difCount = 0;
                let dataStorage = this.getOwnerComponent().getModel(Constants.model.storageModel).getData();
                let repetidos = [];
                oData.pallets.forEach(oPackage => {
                    let dataType = this.getOwnerComponent().getModel(Constants.model.typeBultosModel).getData();
                    let IN_TRANS_GRP = "";
                    dataType.forEach(type => {
                        if (type.EX_VTEXT == oPackage.type) {
                            IN_TRANS_GRP = type.EX_TRAGR;
                        }
                    });
                    let target = oPackage.targetStorageLocation;
                    dataStorage.forEach(storage => {
                        if (storage.EX_LGOBE == target){
                            target = storage.EX_LGORT;
                        }
                    });
                    oPackage.item.forEach(item => {
                        if (count.length == 2) {
                            count = "00" + count;
                        } else if (count.length == 3) {
                            count = "0" + count;
                        }
                        let deliveryOrder = item.deliveryOrder;
                        if (deliveryOrderAnt != deliveryOrder){
                            difCount = difCount + 1;
                            if (difCount > corte) {
                                difCount = 1;
                                IN_OUTBOUND_DELIVERY = IN_OUTBOUND_DELIVERY + 1;
                            }
                        }
                        let IN_FLAG_FREE_TEXT = "";
                        if (item.materialCode == MATERIAL_FREE_TEXT){
                            IN_FLAG_FREE_TEXT = "X";
                        }
                        let newItem = {
                            IN_PACKAGE: oPackage.code,
                            IN_PACKAGE_QUANTITY: oPackage.quantity.toString(),
                            IN_PACKAGE_WEIGHT: oPackage.weight.toString(),
                            IN_PACKAGE_TYPE: IN_TRANS_GRP,
                            IN_OUTBOUND_DELIVERY: IN_OUTBOUND_DELIVERY.toString(),
                            IN_PO_ITEM: count,
                            IN_MATERIAL: item.materialCode,
                            IN_PLANT: IN_PLANT,
                            IN_STGE_LOC: target,
                            IN_QUANTITY: item.quantity.toString(),
                            IN_ERFME: item.unitMeasure,
                            IN_SUPPL_STLOC: IN_SUPPL_STLOC,
                            IN_TRACKINGNO: item.deliveryOrder,
                            IN_PREQ_NAME: item.code,
                            IN_SHORT_TEXT: item.description,
                            IN_ACCTASSCAT: IN_ACCTASSCAT,
                            IN_GL_ACCOUNT: "",
                            IN_SAKTO: item.EX_SAKTO,
                            IN_MJAHR: item.EX_MJAHR,
                            IN_COST_CENTER: item.ceco,
                            IN_TRANS_GRP: IN_TRANS_GRP,
                            IN_FLAG_FREE_TEXT: IN_FLAG_FREE_TEXT
                        };
                        items.push(newItem);
                        count = (parseInt(count) + 10).toString();
                        deliveryOrderAnt = deliveryOrder;
                    });
                });
                return items;
            },
            showProcessed: function (oEvent) {
                let oData = this.getOwnerComponent().getModel(Constants.model.gdModel).getData()
                if (oEvent.getSource().getProperty("state")){
                    oData.forEach(GD => {
                        if (GD.status == "processed"){
                            GD.visible = true;
                        }
                    });
                } else {
                    oData.forEach(GD => {
                        if (GD.status == "processed"){
                            GD.visible = false;
                        }
                    });
                }
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_gd.id);
                let oList = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_gd.list);
                if (oList.getSelectedItem() != undefined) {
                    oList.getSelectedItem().setSelected(false);
                    let oModel = new JSONModel();
                    this.getOwnerComponent().setModel(oModel, Constants.model.guideModel);
                }
                this.getOwnerComponent().getModel(Constants.model.gdModel).setData(oData);                      
            },
            showLogs: async function (oEvent) {
                let type = oEvent.getSource().getType();
                let path = oEvent.getSource().getParent().getBindingContext(Constants.model.guideModel).getPath();
                let item = this.getOwnerComponent().getModel(Constants.model.guideModel).getProperty(path);
                let gd =  this.getOwnerComponent().getModel(Constants.model.guideModel).getProperty(Constants.properties.guideModel.property1);
                let code =  item.code;
                let msg = "";
                this.oLoaderData.open();
                let logs = await this.getLog(code, gd);
                let that = this;
                let errors = {
                    STO: [],
                    CGR: [],
                    COD: []
                }
                logs.forEach(log => {
                    switch (log.step) {
                        case "STO":
                            errors.STO.push(log.msg);
                            break;
                        case "CGR":
                            errors.CGR.push(log.msg);
                            break;
                        case "COD":
                            errors.COD.push(log.msg);
                            break;
                        default:
                            break;
                    }
                });
                if (errors.STO.length > 0) {
                    msg = msg + that._get_i18n("STO") + ":\n\n"
                    errors.STO.forEach(error => {
                        msg = msg + " - " + error + "\n";
                    });
                    msg = msg + "\n";
                } else {
                    msg = msg + that._get_i18n("STO") + ": " + that._get_i18n("dialog_msg_14") + "\n\n";
                }
                if (errors.CGR.length > 0) {
                    msg = msg + that._get_i18n("CGR") + ":\n\n"
                    errors.CGR.forEach(error => {
                        msg = msg + " - " + error + "\n";
                    });
                    msg = msg + "\n";
                } else {
                    msg = msg + that._get_i18n("CGR") + ": " + that._get_i18n("dialog_msg_14") + "\n\n";
                }
                if (errors.COD.length > 0) {
                    msg = msg + that._get_i18n("COD") + ":\n\n"
                    errors.COD.forEach(error => {
                        msg = msg + " - " + error + "\n";
                    });
                    msg = msg + "\n";
                } else {
                    msg = msg + that._get_i18n("COD") + ": " + that._get_i18n("dialog_msg_14") + "\n\n";
                }
                if (type == "Accept") {
                    this.oLoaderData.close();
                    this._buildDialog(this._get_i18n("dialog_success"), "Success", msg).open();
                } else {
                    msg = msg + this._get_i18n("dialog_msg_17");
                    this.oLoaderData.close();
                    this._buildDialog(this._get_i18n("dialog_error"), "Error", msg).open();
                }
            }

        });
    });
