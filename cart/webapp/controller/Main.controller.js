sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/f/library",
	"sap/m/MessageBox",
    "sap/ui/model/Filter",
	"sap/ui/core/Fragment"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, library, MessageBox, Fragment) {
        "use strict";
        return Controller.extend("cart.controller.Main", {
            onInit: function () {
                //카트 모델 설정
                var oCartModel = new JSONModel();
                this.getView().setModel(oCartModel, 'cart');


                // 상위 컴포넌트에 접근해서 라우터 가져옴
                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute('RouteMain').attachPatternMatched(this._onPatternMatched, this);
            },
            _onPatternMatched: function(oEvent){
                var oArgu = oEvent.getParameter('arguments');
                console.log("Main: ", oArgu["?query"].test);
            },
            onCollapseExpandPress() {
                const oSideNavigation = this.byId("sideNavigation"),
                    bExpanded = oSideNavigation.getExpanded();
    
                oSideNavigation.setExpanded(!bExpanded);
            },
            
            onCartPress: function(){
                var oDataModel = this.getView().getModel();
                // var oFilter = new Filter("Custid","EQ", 'UUU777');
                var sPath = "/ZBBT_SD110Set";
                
                if(oDataModel ){
                    oDataModel .read(sPath, {
                        // filters:[oFilter],
                        success: function (oData) {
                          console.log('조회', oData.results);
                          // 전역 모델에 데이터 설정
                        var oCartModel = this.getOwnerComponent().getModel("cart");
                        oCartModel.setData({ CartItems: oData.results });
                        console.log('viewcompo:', oCartModel.getData());

                        //   this.getView().getModel('cart').setData(oData.results);
                        //   console.log('view:', this.getView().getModel('cart').getData());
                        //   this.getView().getModel('cart').setData(oData);
                          // this.getView().getModel('cart').setProperty("/CartItems", oData.results);
                        }.bind(this),
                        error: function (oError) {
                          console.error("Failed to load ZBBT_SD110Set data", oError);
                        }
                      });
                }
                
                this.oRouter.navTo('RouteCart', {
                    key1: 'UUU777'
                       }, true);
                // .navTo('라우트 객체 이름(name)', {파라미터 정보}, history 초기화)
            },
        });
    });
