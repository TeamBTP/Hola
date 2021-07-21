jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.define([
	], function () {
		"use strict";

		return {
            formatDate: function (sDate) {
                if (!sDate) {
                    return;
                }
                let year = sDate.slice(0,4);
                let mounth = sDate.slice(4,6);
                let day = sDate.slice(6,8)
                // var date = new Date(sDate);
                // var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                //     pattern: "yyyy-MM-dd"
                // });
                // return dateFormat.format(date);
                return year + "-" + mounth + "-" + day
            },
            formatTypeMaterials: function (type) {
                if (type == "X") {
                    return this._get_i18n("consignmentMaterials");
                } else {
                    return this._get_i18n("freelyUsableMaterials");
                }
            }
		};
	}, true);