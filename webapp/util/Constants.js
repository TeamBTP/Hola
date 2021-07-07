sap.ui.define([
	], function () {
		"use strict";

		return {
            model: {
                I18N: "i18n",
                transportModel: "transportModel",
                guideModel: "guideModel",
                palletModel: "palletModel",
                infoModel: "Info",
                orderModel: "orderModel",
                gdModel: "GD",
                infoTModel: "infoTModel"
            },
            json: {
                gdd: "GDD.json",
                transport:"TipoTransporte.json"
            },
            dialogs: {
                dialog1: {
                    id: "idDialogWeight",
                    name: "weight",
                    route: "tmsmanifest.tmsmanifest.fragments.dialogs.weight"
                }
            },
            filters: {
                filter1:"Proveedor",
                filter2:"Numero_guia",
                filter3:"Fecha"
            },
            properties: {
                guideModel: {
                    property1: "/Numero_guia",
                    property2: "/Proveedor",
                    property3: "/Fecha"
                },
                infoModel: {
                    property1: "/countItems",
                    property2 : "/countPallets",
                    property3: "/totalWeight",
                    property4: "/um",
                    property5: "/weight",
                    property6: "/transport",
                    property7: "/transport/weightMax"
                },
                palletModel: {
                    property1: "/items"
                },
                orderModel: {
                    property1: "/pallets"
                },
                i18n: {
                    property1: "enableDelete",
                    property2: "disableDelete"
                }
            },
            ids: {
                mainView: {
                    iconTabBar: "idIconTabBarMulti"
                },
                icontabfilter_gd:{
                    id: "idFragmentITFGD",
                    list: "idListGD",
                    table: "idTableDetailGuide"
                },
                icontabfilter_bulto:{
                    id: "idFragmentITFBulto",
                    columnAction: "idColumnAction"
                },
                icontabfilter_TT:{
                    id: "idFragmentITFTT",
                    tableTransport: "idTableTransport"
                }
            },
            routes: {
                main: "Main",
                FRAGMENTS: {
                    dialog: "EjercicioInte1.EjercicioInte1.fragments.dialogoDetalle"
                }
            }
		};
	}, true);