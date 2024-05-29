sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/DateFormat"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, DateFormat) {
        "use strict";
        var checkID = false;

        return Controller.extend("cart.controller.Signup", {
            onInit: function () {
                //onInit 한번만 실행 
                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute("RouteSignup").attachPatternMatched(this._onPatternMatched, this);

            },
            //일치 할 때마다 실행
            _onPatternMatched: function(oEvent) {
                checkID = false;
                // RouteDetail 라우트 객체의 Pattern이 일치할 때마다 해당 이벤트 실행
                var oArgu = oEvent.getParameters().arguments;
                console.log('Signup init: ',oArgu);
            },

            onCheckDuplicatePress: function() {
                var sUsername = this.getView().byId("username").getValue();
            
                if (!sUsername) {
                    alert("아이디를 입력하세요.");
                    return;
                }
            
                var oModel = this.getView().getModel();
                var sPath = "/zbbt_sd010Set('" + sUsername + "')";
            
                oModel.read(sPath, {
                    success: function(oData) {
                        if (oData) {
                            alert( "이미 존재하는 아이디입니다.");
                            // 아이디 입력값 지움
                            this.getView().byId("username").setValue("");
                        } else {
                            alert("사용 가능한 아이디입니다.");
                            checkID = true;
                        }
                    }.bind(this),
                    error: function() {
                        alert("사용 가능한 아이디입니다.");
                        checkID = true;
                    }
                });
            },

            setAge: function () {
                var oDatePicker = this.byId("bday");
                var sValue = oDatePicker.getValue();  // Get the value from DatePicker
                
                if (!sValue) {
                    alert("생일을 입력하세요");
                    return;
                }
                
                var oDateFormat = DateFormat.getDateInstance({pattern: "yyyy-MM-dd"});
                var oDate = oDateFormat.parse(sValue);
                var iYear = oDate.getFullYear();
                var iCurrentYear = new Date().getFullYear();

    
                // Calculate Korean Age
                var iKoreanAge = iCurrentYear - iYear + 1;
                if(iKoreanAge <= 0){
                    alert("올바른 생일을 입력하세요");
                    this.byId("bday").setValue("");
                    return;
                }
                // Determine the age group
                var iAgeGroup;
                if (iKoreanAge >= 1 && iKoreanAge < 20) {
                    iAgeGroup = 1; // 10대
                } else if (iKoreanAge >= 20 && iKoreanAge < 30) {
                    iAgeGroup = 2; // 20대
                } else if (iKoreanAge >= 30 && iKoreanAge < 40) {
                    iAgeGroup = 3; // 30대
                } else if (iKoreanAge >= 40 && iKoreanAge < 50) {
                    iAgeGroup = 4; // 40대
                } else if (iKoreanAge >= 50 && iKoreanAge < 60) {
                    iAgeGroup = 5; // 50대
                } else if (iKoreanAge >= 60 && iKoreanAge < 70) {
                    iAgeGroup = 6; // 60대
                } else if (iKoreanAge >= 70) {
                    iAgeGroup = 7; // 70대 이상
                } else {
                    iAgeGroup = 0; // Invalid age
                }
    
                // Set the corresponding item in the Select control
                var oSelect = this.byId("ageSelect");  // Assuming the Select control has the ID "ageSelect"
                oSelect.setSelectedKey(iAgeGroup.toString());
            },

            onSignupPress: function () {
                var oView = this.getView();
    
                var sUsername = oView.byId("username").getValue();
                var sPassword = oView.byId("password").getValue();
                var sName = oView.byId("name").getValue();
                var sGender = oView.byId("genderMale").getSelected() ? "1" : "2";
                var sPhone = oView.byId("phone").getValue();
                var sAddress = oView.byId("address").getValue();
                var sBirthday = oView.byId("bday").getValue();
                var sAgeGroup = oView.byId("ageSelect").getSelectedKey();
    
                if (!sUsername || !sPassword || !sName || !sPhone || !sAddress || !sBirthday || !sAgeGroup) {
                    alert("모든 필드를 채워주세요.");
                    return;
                }
                if (!checkID) {
                    alert('아이디 중복확인을 시행해주세요.');
                    return;
                }
    
                var oDateFormat = DateFormat.getDateInstance({pattern: "yyyy-MM-dd"});
                var oBirthday = oDateFormat.parse(sBirthday);
                var sFormattedBirthday = oDateFormat.format(oBirthday) + "T00:00:00";
    
                var oCurrentDate = new Date();
                var sCurrentDate = oDateFormat.format(oCurrentDate) + "T00:00:00";
    
                var oSignupData = {
                    "Custid": sUsername,
                    "Custpw": sPassword,
                    "Custnm": sName,
                    "Custgen": sGender,
                    "Custadd": sAddress,
                    "Custtel": sPhone,
                    "Custbirth": sFormattedBirthday,
                    "Custage": sAgeGroup,
                    "Custsdat": sCurrentDate
                };
    
                var oModel = this.getView().getModel();
    
                oModel.create("/zbbt_sd010Set", oSignupData, {
                    success: function () {
                        sap.m.MessageToast.show("회원가입이 완료되었습니다!");
    
                        // Reset all input fields
                        oView.byId("username").setValue("");
                        oView.byId("password").setValue("");
                        oView.byId("name").setValue("");
                        oView.byId("genderMale").setSelected(true);
                        oView.byId("genderFemale").setSelected(false);
                        oView.byId("phone").setValue("");
                        oView.byId("address").setValue("");
                        oView.byId("bday").setValue("");
                        oView.byId("ageSelect").setSelectedKey("");
    
                        // Reset JSON data
                        oSignupData = {};
                        this.oRouter.navTo('RouteLogin');
                    }.bind(this),
                    error: function () {
                        MessageToast.show("회원가입에 실패했습니다. 다시 시도해주세요.");
                    }
                });
    
                console.log(oSignupData);
            },
        

            onNavBack: function(){
                // URL parameter로 넘기는 데이터가 많으면
                // JSONModel을 사용하는게 url 길이제한땜에 조흠
                this.oRouter.navTo('RouteLogin',{
                    'query' : {
                        key1: 'UUU777',
                        key2: 'Signup'
                    }
                });
            }
        });
    });