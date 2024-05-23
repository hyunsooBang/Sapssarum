sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("login.controller.Signup", {
            onInit: function () {
                //onInit 한번만 실행 
                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute("RouteSignup").attachPatternMatched(this._onPatternMatched, this);

            },
            //일치 할 때마다 실행
            _onPatternMatched: function(oEvent) {
                // RouteDetail 라우트 객체의 Pattern이 일치할 때마다 해당 이벤트 실행
                var oArgu = oEvent.getParameters().arguments;
                
                console.log('Detail: ',oArgu);
            },

            onNavBack: function(){
                //URL parameter로 넘기는 데이터가 많으면
                // JSONModel을 사용하는게 url 길이제한땜에 조흠
                this.oRouter.navTo('RouteMain',{
                    'query' : {
                        tab: 'okk',
                        test: 10
                    }

                });
            
            }
        });
    });
