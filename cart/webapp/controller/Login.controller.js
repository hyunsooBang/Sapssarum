sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("cart.controller.Login", {
            onInit: function () {
                //onInit 한번만 실행 
                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute("RouteLogin").attachPatternMatched(this._onPatternMatched, this);

            },
            //일치 할 때마다 실행
            _onPatternMatched: function(oEvent) {
                // RouteDetail 라우트 객체의 Pattern이 일치할 때마다 해당 이벤트 실행
                var oArgu = oEvent.getParameters().arguments;
                console.log('Login: ',oArgu);
            },
            onSignUpPress1: function(){
                this.oRouter.navTo('RouteSignup', {
                   key1: 'signup'
                }, true);
                // .navTo('라우트 객체 이름(name)', {파라미터 정보}, history 초기화)
            },
            onLoginPress: function() {
                var oView = this.getView();
                var sId = oView.byId("id").getValue();
                var sPassword = oView.byId("password").getValue();
            
                if (!sId || !sPassword) {
                    alert("아이디와 비밀번호를 모두 입력하세요.");
                    return;
                }
            
                var oModel = this.getView().getModel(); 
                var sPath = "/zbbt_sd010Set('" + sId + "')";
            
                var that = this; // 컨텍스트를 저장하기 위해 this를 변수에 할당합니다.
            
                oModel.read(sPath, {
                    success: function(oData) {
                        if (!oData) {
                            alert("존재하지 않는 아이디입니다.");
                        } else {
                            var sCustPw = oData.Custpw;
                            if (sCustPw !== sPassword) {
                                alert("비밀번호를 확인하세요.");
                            } else {
                                var sCustnm = oData.Custnm;
                                sap.m.MessageToast.show("환영합니다, " + sCustnm + "님.");
                        
                                
                                // 컨트롤러의 컨텍스트가 필요한 부분에서는 미리 저장한 변수를 사용합니다.
                                that.getOwnerComponent().getModel("userData").setProperty("/userId", sId);
                                
                                // Redirect to main page
                                // Assuming you have a router configured
                                var oRouter = sap.ui.core.UIComponent.getRouterFor(oView);
                                oRouter.navTo('RouteMain', {
                                    'query': {
                                        id: sId,
                                        // test: 10
                                    }
                                });
                            }
                        }
                    },
                    error: function() {
                        alert("데이터를 가져오는 중에 오류가 발생했습니다.");
                    }
                });
            },
            
            
            

            // onNavBack: function(){
            //     //URL parameter로 넘기는 데이터가 많으면
            //     // JSONModel을 사용하는게 url 길이제한땜에 조흠
            //     this.oRouter.navTo('RouteMain',{
            //         'query' : {
            //             // tab: 'okk',
            //             // test: 10
            //         }

            //     });
            
            // }
        });
    });