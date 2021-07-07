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
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, Services, JSONModel, Filter, FilterOperator, View, MessageToast, MessageBox, Constants) {
		"use strict";

		return Controller.extend("tmsmanifest.tmsmanifest.controller.View1", {
			onInit: function () {
                //Array de dialogs, aqui se guardaran todos los dialogs que usaremos para no tener que crearlos cada vez que se llamen
                this.Dialogs = {}
                //Aqui se guardara el dialog que se este usando en ese momento en la App
                this.Dialog;
                //Funcion que carga la data en el modelo principal de la App 
                this.loadModel();
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
                let oInfo = {
                    transport: "",
                    countItems: 0,
                    countPallets: 0,
                    um: "",
                    weight: 0,
                    totalWeight: 0
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
                this.getTransportType().then((data) => {
                    console.log(data)
                })
            },

            //Funcion encargada de obtener la data (tipo de transportes) desde el servicio de ERP la cual es guardada en un modelo 
            getTransportType: function () {
                var oController = this;

                var model = oController.getOwnerComponent().getModel("MODEL_ZTM_CARGO_MANIFEST_SRV");
                var service = "/ZTM_CM_RESOURCESet";
                var filters = []
                var oData = {};
                return new Promise(function (resolve, reject) {
                    oController.RequestSAPGETPromise(model, filters, service, oData).then(data => {
                        //Response Ok
                        let oData = [];
                        let json= {};
                        let EX_RESUID_ANT = "";
                        data.forEach(item => {
                            let EX_RESUID = item["EX_RESUID"];
                            if (EX_RESUID == EX_RESUID_ANT){
                                json.EX_DIMENSION2 = item["EX_DIMENSION"];
                                json.EX_NOINDIVRES2 = item["EX_NOINDIVRES"].replace(".", ",");
                                json.EX_NOINDIVRES_UNIT2 = item["EX_NOINDIVRES_UNIT"];
                                oData.push(json);
                                json = {}
                            } else {
                                json.EX_RESUID = EX_RESUID;
                                json.EX_NAME =  item["EX_NAME"];
                                json.EX_DIMENSION1 = item["EX_DIMENSION"]
                                json.EX_NOINDIVRES = item["EX_NOINDIVRES"].replace(".", ",");
                                json.EX_NOINDIVRES_UNIT = item["EX_NOINDIVRES_UNIT"];
                                EX_RESUID_ANT = EX_RESUID;
                            }
                        });                        
                        let oModel = new JSONModel(oData);                        
                        oController.getOwnerComponent().setModel(oModel, Constants.model.transportModel);
                        resolve(data);
                    }).catch((e) => {
                        //Response Error
                        console.log(e)
                        resolve();
                    });
                });
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

            //Funcion encargada de obtener la data (guias de despacho) de un json la cual es guardada en un modelo 
            loadModel: async function () {
                const oResponse = await Services.getLocalJSON(Constants.json.gdd);
                const oData = oResponse[0];
                //se le agrega dos campos a cada guia del json para saber si ya fue procesado el item
                oData.forEach(GD => {
                    GD.detail.forEach(item => {
                        item.selected = false;
                        item.editable = true;
                    });
                });
                var oModel = new JSONModel();
                oModel.setData(oData);
                this.getOwnerComponent().setModel(oModel, Constants.model.gdModel);
            },
            // loadTransportModel: async function () {
            //     const oResponse = await Services.getLocalJSON(Constants.json.transport);
            //     const oData = oResponse[0];
            //     var oModel = new JSONModel();
            //     oModel.setData(oData);
            //     this.getOwnerComponent().setModel(oModel, Constants.model.transportModel);
            // },
            //Esta funcion ocurre al momento de cambiar la seleccion en la lista de Guias de despacho
            //para asi guardar en el modelo guideModel la guia actualmente seleccionada 
            selectGD: function (oEvent) {
                let oBindingContext = oEvent.getSource().getSelectedItem().getBindingContext(Constants.model.gdModel);
                let oModel = this.getOwnerComponent().getModel(Constants.model.gdModel);
                let oGDSeleccionado = oModel.getProperty(oBindingContext.getPath());
                this.getOwnerComponent().getModel(Constants.model.guideModel).setData(oGDSeleccionado);
                this.validateSelected();
            },
            //Funcion que se usa para la busqueda en la lista de guias de despacho, la cual busca tanto por Proveedor (filter1),
            //numero_guia (filter2) y fecha de la guia (filter3)
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
                        oItem.deliveryOrders = oModel.getProperty(Constants.properties.guideModel.property1);
                        oItem.proveedor = oModel.getProperty(Constants.properties.guideModel.property2);
                        oItem.fecha = oModel.getProperty(Constants.properties.guideModel.property3);
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
                //Actualizamos la cantidad de items que se añadieron en el bulto
                let count = itemsAceptados.length
                let sumaCount = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property1) + count;
                this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property1, sumaCount);
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
            deleteGD: function (oEvent) {
                //Obtenemos del boton su contendor con el getParent() que seria la fila completa de la tabla (el item)
                let row = oEvent.getSource().getParent();
                //Modelo que contiene los items del bulto que crearemos
                let oPalletModel = this.getView().getModel(Constants.model.palletModel);
                //Modelo que contiene las guias de despachos
                let oGDModel = this.getView().getModel(Constants.model.gdModel);
                //Obtenemos el path del item que eliminaran para luego seleccionarlo del modelo 
                let path = row.getBindingContext(Constants.model.palletModel).getPath();
                let itemDelete = oPalletModel.getProperty(path);
                //Del item obtenemos el deliveryOrders para identificar de que guia proviene y desbloquear su uso para agregarlo en otro bulto posteriormente
                let nGuide = itemDelete.deliveryOrders;
                let guide = oGDModel.getData().find(guide => guide.Numero_guia == nGuide);
                //Obtenemos el item original que viene del modelo GD
                let item = guide.detail.find(item => item.Item == itemDelete.Item);
                //Obtenemos los index del item y la guia para luego setear el selected y editable del item para que ya no este bloqueado
                let indexItem = guide.detail.findIndex(item => item.Item == itemDelete.Item);
                let indexGuide = oGDModel.getData().findIndex(guide => guide.Numero_guia == nGuide)
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
                let indice = parseInt(row.getIdForLabel().split("-")[6]);
                let arrayItems = oPalletModel.getData().items;
                arrayItems.splice(indice, 1);
                oPalletModel.setProperty(Constants.properties.palletModel.property1, arrayItems);
                //Actualizamos el contador de items del Bulto
                let sumaCount = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property1) - 1;
                this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property1, sumaCount);
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
            createPallet: function () {
                //Llamamos a la funcion que creara el dialogo y nos lo retornara y asi podremos abrirlo
                this.createDialogs(Constants.dialogs.dialog1.name, Constants.dialogs.dialog1.id, Constants.dialogs.dialog1.route).open();
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
                    codBulto: cod + 1,
                    detail: detail
                };
                //Obtenemos los datos que se ingresaron en el dialogo y el peso total que hay actualmente en el camion que se guardaron en el infoModel
                let totalWeight = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property3);
                let um = this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property4);
                let weight = parseFloat(this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property5));
                let maxWeight = parseInt(this.getView().getModel(Constants.model.infoModel).getProperty(Constants.properties.infoModel.property7));
                //TODO: Verificar si se usaran mas de un sistema de medicion
                //en caso de que el bulto se pesara en KG debemos transformarlo a TON
                if (um == "KG") {
                    weight = weight / 1000
                }
                //Aqui verificamos si el peso que se quiere ingresar hace que superemos el limite de peso del camion, si esto no sucede se crea el bulto
                if (totalWeight + weight <= maxWeight) {
                    //Obtenemos del OrderModel la propiedad pallets que contiene un arreglo de pallets
                    let aPallets = this.getView().getModel(Constants.model.orderModel).getProperty(Constants.properties.orderModel.property1);
                    //Al nuevo bulto le añadimos 3 propiedades el peso, la unidad de medida y la cantidad de items que tiene 
                    newBulto.weight = weight;
                    newBulto.um = um;
                    newBulto.countItems = newBulto.detail.length;
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
                    this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property4, "");
                    //Actulizamos el nuevo peso total que lleva el camion
                    this.getView().getModel(Constants.model.infoModel).setProperty(Constants.properties.infoModel.property3, totalWeight + weight);
                    //sino se lanza un error y no se guarda el bulto
                } else {
                    //TODO: Definir mensaje en español e ingles si es que se necesita
                    MessageBox.error("You have surpassed the limit of " + maxWeight + " TON. \n" +
                        "There is : " + Math.round(((totalWeight + weight) - maxWeight), -3) + " extra TONs");
                }
            },
            //Funcion que creara la orden de envio
            //TODO: debemos redifinir esta funcion con los nuevos requerimientos
            createOrder: function () {
                let that = this;
                MessageBox.confirm("Are you sure that you want to finish this order?", {
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            // MessageToast.show("Freight Order: " + Math.round(Math.random() * (9999999 - 1) + 1), {duration:2000});
                            MessageBox.success(`Your freight order was created successfully
                            `+ `Your number order is: ` + Math.trunc(Math.round(Math.random() * (9999999 - 1) + 1),
                                { title: 'Success!' }),
                                {
                                    onClose: function (oAction) {
                                        let oData = {
                                            pallets: []
                                        }
                                        let oModel = new JSONModel(oData);
                                        that.getView().setModel(oModel, "orderModel");
                                        that.getView().getModel("Info").setProperty("/countPallets", 0);
                                        let tab = that.byId("idIconTabBarMulti");
                                        tab.setSelectedKey("gd");
                                    }
                                }
                            );

                        }
                    }
                });
            },
            //Funcion que se activa al momento que se actualiza la tabla de bultos en Orden de envio
            refresh: function () {
                let tab = this.byId("idIconTabBarMulti");
                if (tab.getSelectedKey() == Constants.model.orderModel) {
                    tab.setSelectedKey(Constants.model.gdModel);
                    tab.setSelectedKey(Constants.model.orderModel);
                }
            },

            confirmTransport: function (oEvent) {
                let sFragmentId = this.getView().createId(Constants.ids.icontabfilter_TT.id);
                let oTable = sap.ui.core.Fragment.byId(sFragmentId, Constants.ids.icontabfilter_TT.tableTransport);
                let oBindingContext = oTable.getSelectedItem().getBindingContext(Constants.model.transportModel);
                let oModel = this.getOwnerComponent().getModel(Constants.model.transportModel);
                let oTransport = oModel.getProperty(oBindingContext.getPath());
                oModel = this.getView().getModel(Constants.model.infoModel);
                oModel.setProperty(Constants.properties.infoModel.property6, oTransport);
                oTable.getItems().forEach(item => {
                    let idRadioButton = item.$().find('.sapMRb').attr('id');
                    sap.ui.getCore().byId(idRadioButton).setEditable(false);
                });
                let tab = this.byId(Constants.ids.mainView.iconTabBar);
                tab.setSelectedKey(Constants.model.gdModel);
                oEvent.getSource().setVisible(false)
            },

            cerrarOrder: function () {
                let tab = this.byId(Constants.ids.mainView.iconTabBar);
                tab.setSelectedKey(Constants.model.infoTModel);
            }
		});
	});
