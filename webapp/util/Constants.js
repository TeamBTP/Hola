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
                infoTModel: "infoTModel",
                plantModel: "plantModel",
                filterModel: "filterModel",
                storageModel: "storageModel",
                vendorModel: "vendorModel",
                centroModel: "centroModel",
                carrierModel: "carrierModel",
                typeBultosModel: "typeBultosModel",
                headerModel: "headerModel",
                logsModel: "logsModel",
                sourceStorageModel: "sourceStorageModel"
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
                },
                dialog2: {
                    id: "idDialogFilters",
                    name: "filters",
                    route: "tmsmanifest.tmsmanifest.fragments.dialogs.filter"
                },
                dialog3: {
                    id: "idDialogFilterHome",
                    name: "filterHome",
                    route: "tmsmanifest.tmsmanifest.fragments.dialogs.filterHome"
                }
            },
            filters: {
                filter1:"provider",
                filter2:"deliveryOrder",
                filter3:"date"
            },
            properties: {
                guideModel: {
                    property1: "/deliveryOrder",
                    property2: "/provider",
                    property3: "/date",
                    property4: "/code",
                    property5: "/EX_MJAHR"
                },
                infoModel: {
                    property1: "/countItems",
                    property2 : "/countPallets",
                    property3: "/totalWeight",
                    property4: "",
                    property5: "/weight",
                    property6: "/transport",
                    property7: "/transport/EX_NOINDIVRES",
                    property8: "/pathTransport",
                    property9: "/typeMaterials",
                    property10: "/typeBulto",
                    property11: "/bultos",
                    property12: "/EX_LGORT"
                },
                transportModel: {
                    property1: "/Status"
                },
                filterModel: {
                    property1: "/EX_LGORT",
                    property2: "/EX_LIFNR",
                    property3: "/EX_WERKS"
                },
                centroModel: {
                    property1: "/value/0/parameter/0/value"
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
                    table: "idTableDetailGuide",
                    columnCeco: "idColumnCeco",
                    idSwitchProcessed: "idSwitchProcessed"
                },
                icontabfilter_bulto:{
                    id: "idFragmentITFBulto",
                    columnAction: "idColumnAction",
                    buttonCreate: "idButtonCreatePallet",
                    buttonDelete: "idButtonDelete",
                    tableItems: "idTableItems"
                },
                icontabfilter_TT:{
                    id: "idFragmentITFTT",
                    tableTransport: "idTableTransport",
                    buttonAccept: "idButtonAccept"
                },
                icontabfilter_order:{
                    id: "idFragmentITFOrder",
                    buttonClose: "idButtonClose"
                },
                icontabfilter_infoT:{
                    id: "idFragmentITFInfoT",
                    buttonComplete: "idButtonComplete"
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
    

