sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/f/library",
	"sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel,  MessageBox, Dialog, Button, Text, Filter, FilterOperator, library, Fragment) {
        "use strict";
        var history = {
            prevPaymentSelect: null,
            prevDiffDeliverySelect: null
        };

        var id;
        
        
        return Controller.extend("cart.controller.Cart", {
            onInit: function () {
                //onInit 한번만 실행 
                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute("RouteCart").attachPatternMatched(this._onPatternMatched, this);

                this._wizard = this.byId("ShoppingCartWizard");
                this._oNavContainer = this.byId("navContainer");
                this._oDynamicPage = this.getPage();
               


                   // Wizard 초기화 및 첫 번째 단계로 설정
                // this._wizard.setCurrentStep(this._wizard.getSteps()[1]);
                
                this.model = new JSONModel();
			    this.model.attachRequestCompleted(null, function () {
                    
				// this.model.getData().ProductCollection.splice(5, this.model.getData().ProductCollection.length);
                console.log('reqyest');
				this.model.setProperty("/selectedPayment", "Credit Card");
				this.model.setProperty("/selectedDeliveryMethod", "Standard Delivery");
				this.model.setProperty("/differentDeliveryAddress", false);
				this.model.setProperty("/CashOnDelivery", {});
				this.model.setProperty("/BillingAddress", {});
				this.model.setProperty("/CreditCard", {});
				this.model.updateBindings();
			}.bind(this));
            this.getView().setModel(this.model, 'data');

            this.getView().setModel(new JSONModel(), 'cart');
            this.getView().setModel(new JSONModel(), 'price');
            var custModel = new JSONModel({
                address: "",
                detailAddress: "",
                phoneNumber: "",
                recipientName: "",
                memo: ""
            });
            this.getView().setModel(custModel, 'cust');
            
            
            },

            formatCurrency: function (amount) {
                // 숫자를 통화 형식(콤마)으로 변환하여 반환
                return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },

            calcTotal: function () {
                // 'cart' 모델에서 전체 데이터를 가져옴
                var aCartItems = this.getView().getModel('cart').getData();
            
                // aCartItems가 유효한지 확인 (빈 배열일 수 있음)
                if (!aCartItems || !Array.isArray(aCartItems)) {
                    aCartItems = [];
                }
            
                // TotalPrice를 합산
                var fTotalPrice = aCartItems.reduce(function (sum, item) {
                    return sum + (parseFloat(item.TotalPrice) || 0); // TotalPrice가 없으면 0으로 처리
                }, 0);
            
                // 'data' 모델의 /ProductsTotalPrice 속성에 총 가격 설정
                console.log('totalprice',fTotalPrice);
                var sFormattedTotalPrice = this.formatCurrency(fTotalPrice);
                this.getView().getModel('data').setProperty("/ProductsTotalPrice",  sFormattedTotalPrice);
            },

             //일치 할 때마다 실행
             _onPatternMatched: function(oEvent) {
                // RouteDetail 라우트 객체의 Pattern이 일치할 때마다 해당 이벤트 실행
                var oArgu = oEvent.getParameters().arguments;
                console.log('ID: ', oArgu.key1);
                id = oArgu.key1;
                var oDataModel1 = this.getView().getModel();
               
                var sPath1 = "/zbbt_sd010Set('" + id + "')"; // Custid를 이용하여 경로 설정
                oDataModel1.read(sPath1, {
                    success: function (oData) {
                        // 성공적으로 데이터를 읽어왔을 때
                        console.log('name data', oData);
                        var sCustnm = oData.Custnm; // Custnm 값을 가져와 변수에 저장
                        // name 변수에 Custnm 값을 설정
                        console.log('name:',sCustnm);
                        this.getView().getModel('data').setProperty("/name", sCustnm);
                    }.bind(this),
                    error: function (oError) {
                        // 데이터를 읽어오지 못했을 때의 처리
                        console.error("Failed to load ZBBT_SD010Set data", oError);
                    }
                });


                this.loadCartItemsData();
                this._wizard.discardProgress(this._wizard.getSteps()[0]);
                this.handleNavBackToList();
                
            },
            onIncreaseQuantity: function (oEvent) {
                var oItem = oEvent.getSource().getBindingContext("cart").getObject();
                var oCartModel = this.getView().getModel("cart");
                var aCartItems = oCartModel.getData();
                console.log('cartitme1',aCartItems);
                aCartItems.forEach(function(item) {
                    if (item.Matno === oItem.Matno) {
                        item.Quantity = (parseInt(item.Quantity, 10) + 1).toString();
                        item.TotalPrice = (parseFloat(item.Price) * parseFloat(item.Quantity)).toFixed(0);
                    }
                });
                console.log('cartitme2',aCartItems);
                oCartModel.setData(aCartItems);
                this.calcTotal(aCartItems);
            },
            
            onDecreaseQuantity: function (oEvent) {
                var oItem = oEvent.getSource().getBindingContext("cart").getObject();
                var oCartModel = this.getView().getModel("cart");
                var aCartItems = oCartModel.getData();
                aCartItems.forEach(function(item) {
                    if (item.Matno === oItem.Matno && parseInt(item.Quantity, 10) > 1) {
                        item.Quantity = (parseInt(item.Quantity, 10) - 1).toString();
                        item.TotalPrice = (parseFloat(item.Price) * parseFloat(item.Quantity)).toFixed(0);
                    }
                });
                oCartModel.setData(aCartItems);
                this.calcTotal(aCartItems);
            },
            onNavBack: function(){
                //URL parameter로 넘기는 데이터가 많으면
                this.clearDatabase();
                // this.saveJsonToDatabase();
                this.oRouter.navTo('RouteMain',{
                    'query' : {
                        // tab: 'okk',
                        // test: 10
                    }

                });
            
            },
            clearDatabase: function() {
                var oModel = this.getView().getModel(); // OData 모델 가져오기
                var oDBCartModel = this.getView().getModel('cart'); // 'cart' 모델 가져오기
                var aDBcartData = oDBCartModel.getData(); // 모델의 데이터 가져오기
                
                if (!Array.isArray(aDBcartData)) {
                    console.error("DBcart 데이터가 배열이 아닙니다.");
                    return;
                }
            
                // 각 항목을 개별적으로 삭제
                aDBcartData.forEach(function(oEntity) {
                    var sEntityPath = oModel.createKey("/ZBBT_SD110Set", {
                        Custid: oEntity.Custid,
                        Matno: oEntity.Matno // 키 필드 추가
                    });
                    oModel.remove(sEntityPath, {
                        success: function() {
                            console.log("삭제 완료: " + sEntityPath);
                        }.bind(this),
                        error: function(oError) {
                            console.error("삭제 실패: " + sEntityPath, oError);
                        }
                    });
                }.bind(this));
            },
            
            
            saveDBCartToDatabase: function() {
                var oDBCartModel = this.getView().getModel('cart');
                var oODataModel = this.getView().getModel(); // OData 모델 가져오기
                var aData = oDBCartModel.getData();
            
                aData.forEach(function(item) {
                    var oEntry = {
                        Custid: item.Custid,
                        Matno: item.Matno,
                        Quantity: item.Quantity,
                        Unit: item.Unit
                    };
                    oODataModel.create("/ZBBT_SD110Set", oEntry, {
                        success: function() {
                            console.log("데이터베이스에 저장 성공:", oEntry);
                        },
                        error: function(oError) {
                            console.error("데이터베이스에 저장 실패:", oEntry, oError);
                        }
                    });
                });
            },


            loadCartItemsData: function () {
                var oDataModel = this.getView().getModel();
                // var oFilter = new Filter("Custid", FilterOperator.EQ, id);
                var sPath = "/ZBBT_SD110Set";
                var oFilter = new sap.ui.model.Filter("Custid","EQ", id);

                if(oDataModel){
                    oDataModel.read(sPath, {
                        filters:[oFilter],
                        success: function (oData) {
                          console.log('조회2', oData.results);
                          // json 모델에 데이터 설정
                        var oCartModel = this.getView().getModel("cart");
                        oCartModel.setData(oData.results);
                            var aCartItems = oData.results;
                         // 각 Matno에 대해 ZBBT_mm020Set에서 Price 가져오기
                         var aPromises = aCartItems.map(function (oItem) {
                            return new Promise(function (resolve, reject) {
                                var sPricePath = "/ZBBT_MM020Set('" + oItem.Matno + "')";
                                oDataModel.read(sPricePath, {
                                    success: function (oPriceData) {
                                        oItem.Matnm = oPriceData.Matnm;
                                        oItem.Mattxt =oPriceData.Mattxt;
                                        resolve(oItem);
                                    },
                                    error: function (oError) {
                                        reject(oError);
                                    }
                                });
                            });
                        });

                         // 각 Matno에 대해 ZBBT_SD090Set에서 Price 가져오기
                            var aPromises = aCartItems.map(function (oItem) {
                                return new Promise(function (resolve, reject) {
                                    var sPricePath = "/ZBBT_SD090Set('" + oItem.Matno + "')";
                                    oDataModel.read(sPricePath, {
                                        success: function (oPriceData) {
                                            oItem.Price = oPriceData.Price;
                                            oItem.TotalPrice = parseFloat(oItem.Price) * parseInt(oItem.Quantity, 10);
                                            resolve(oItem);
                                        },
                                        error: function (oError) {
                                            reject(oError);
                                        }
                                    });
                                });
                            });

                            // 모든 가격 데이터를 가져온 후 모델에 설정
                            Promise.all(aPromises).then(function (aResults) {
                                var oCartModel = this.getView().getModel("cart");
                                oCartModel.setData(aResults);
                                this.calcTotal();
                                console.log('view json22:', oCartModel.getData());
                            }.bind(this)).catch(function (oError) {
                                console.error("Failed to load price data", oError);
                            });
                        }.bind(this),
                        error: function (oError) {
                            console.error("Failed to load ZBBT_SD110Set data", oError);
                        

                        console.log('view json:', oCartModel.getData());

                           }.bind(this),
                        error: function (oError) {
                          console.error("Failed to load ZBBT_SD110Set data", oError);
                        }
                      });
                }
            },

           
            getPage: function () {
                return this.byId("dynamicPage");
            },
                      
            handleDelete: function (oEvent) {
                var listItem = oEvent.getParameter("listItem");
                var oModel = this.getView().getModel("cart");
                var sMatnm = listItem.getBindingContext("cart").getProperty("Matnm");
            
                sap.m.MessageBox.confirm("장바구니에서 '" + sMatnm + "'을(를) 삭제하시겠습니까?", {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.YES) {
                            console.log('yes');
                            var aCartItems = oModel.getData();
                            aCartItems = aCartItems.filter(function (item) {
                                return item.Matnm !== sMatnm;
                            });
                            oModel.setData(aCartItems);
                            this.calcTotal();
                        }
                    }.bind(this)
                });
            },
            
            
            
            

            goToPaymentStep: function () {
                var selectedKey = this.model.getProperty("/selectedPayment");
    
                switch (selectedKey) {
                    case "Credit Card":
                        
                        this.byId("PaymentTypeStep").setNextStep(this.getView().byId("CreditCardStep"));
                        // selectedPayment = 'Credit Card';
                        // selectedKey = 'Credit Card';
                        break;
                    case "Bank Transfer":
                        this.byId("PaymentTypeStep").setNextStep(this.getView().byId("BankAccountStep"));
                        break;
                    case "Kakao Pay":
                        this.byId("PaymentTypeStep").setNextStep(this.getView().byId("CashOnDeliveryStep"));
                        break;
                    default:
                        selectedKey = 'Credit Card';
                        this.model.setProperty("/selectedPayment", 'Credit Card');
                        this.byId("PaymentTypeStep").setNextStep(this.getView().byId("CreditCardStep"));
                        break;
                }
            },
            setPaymentMethod: function () {
                this.setDiscardableProperty({
                    message: "결제 유형을 변경하시겠습니까 ? 진행 상황은 저장되지 않습니다.",
                    discardStep: this.byId("PaymentTypeStep"),
                    modelPath: "/selectedPayment",
                    historyPath: "prevPaymentSelect"
                });
            },
            // setDifferentDeliveryAddress: function () {
            //     this.setDiscardableProperty({
            //         message: "배송지 주소를 변경하시겠습니까 ? 진행 상황은 저장되지 않습니다.",
            //         discardStep: this.byId("BillingStep"),
            //         modelPath: "/differentDeliveryAddress",
            //         historyPath: "prevDiffDeliverySelect"
            //     });
            // },
            
            setDifferentDeliveryAddress: function (oEvent) {
                console.log('checked');
                // var bDifferentDeliveryAddress = this.getView().getModel("data").getProperty("/differentDeliveryAddress");

                var checkBox = oEvent.getSource(); // 체크박스 컨트롤 가져오기
                var selected = checkBox.getSelected(); // 선택 여부 확인
                console.log("Checkbox selected:", selected);
                if (selected) {
                    console.log('if');
                    // ZBBT_SD010Set에서 데이터 가져오기
                    var sPath = "/zbbt_sd010Set('" + id + "')";
                    var oDataModel = this.getView().getModel();
                    oDataModel.read(sPath, {
                        success: function (oData) {
                            // 성공적으로 데이터를 읽어왔을 때
                            console.log('checkD:', oData);
                            var custModel = this.getView().getModel("cust");
                            custModel.setProperty("/address", oData.Custadd);
                            custModel.setProperty("/phoneNumber", oData.Custtel);
                            custModel.setProperty("/recipientName", oData.Custnm);
                            this.checkBillingStep();
                            console.log(set)
                            
                        }.bind(this),
                        error: function (oError) {
                            // 데이터를 읽어오지 못했을 때의 처리
                            console.error("Failed to load ZBBT_SD010Set data", oError);
                        }
                    });
                } else {
                    // 체크가 해제되면 모든 값을 초기화
                    console.log('else');
                    var custModel = this.getView().getModel("cust");
                    custModel.setProperty("/address", "");
                    custModel.setProperty("/phoneNumber", "");
                    custModel.setProperty("/recipientName", "");
                }
                
            },

            setDiscardableProperty: function (params) {
                if (this._wizard.getProgressStep() !== params.discardStep) {
                    sap.m.MessageBox.warning(params.message, {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: function (oAction) {
                            if (oAction === sap.m.MessageBox.Action.YES) {
                                this._wizard.discardProgress(params.discardStep);
                                history[params.historyPath] = this.model.getProperty(params.modelPath);
                            } else {
                                this.model.setProperty(params.modelPath, history[params.historyPath]);
                            }
                        }.bind(this)
                    });
                } else {
                    history[params.historyPath] = this.model.getProperty(params.modelPath);
                }
            },
    
            billingAddressComplete: function () {
                if (this.model.getProperty("/differentDeliveryAddress")) {
                    this.byId("BillingStep").setNextStep(this.getView().byId("DeliveryAddressStep")); 
                
                } else {
                    this.byId("BillingStep").setNextStep(this.getView().byId("DeliveryTypeStep"));
                }
            },
    
            handleWizardCancel: function () {
                this._handleMessageBoxOpen("구매를 취소하시겠습니까 ?", "warning");
            },
    
            handleWizardSubmit: function () {
                this._handleMessageBoxOpen("구매 요청을 제출하시겠습니까 ?", "confirm");
            },
    
            backToWizardContent: function () {
                this._oNavContainer.backToPage(this._oDynamicPage.getId());
            },
    
            checkCreditCardStep: function () {
                var cardnumber = this.getView().getModel('data').getData().CardNumber || "";
                var cardcvc = this.getView().getModel('data').getProperty("/CardCode") || "";
                if (cardnumber.length < 1 || cardcvc.length < 1) {
                    this._wizard.invalidateStep(this.byId("CreditCardStep"));
                } else {
                    this._wizard.validateStep(this.byId("CreditCardStep"));
                }
            // 
            },
    
            checkCashOnDeliveryStep: function () {
                // var firstName = this.model.getProperty("/CashOnDelivery/FirstName") || "";
                // if (firstName.length < 3) {
                //     this._wizard.invalidateStep(this.byId("CashOnDeliveryStep"));
                // } else {
                //     this._wizard.validateStep(this.byId("CashOnDeliveryStep"));
                // }
            },
            checkBillingStep: function () {
                var address = this.getView().getModel('cust').getProperty("/address");
                if (address == false) {
                    this._wizard.invalidateStep(this.byId("BillingStep"));
                } else {
                    this._wizard.validateStep(this.byId("BillingStep"));
                }
            },
    
            completedHandler: function () {
                this._oNavContainer.to(this.byId("wizardBranchingReviewPage"));
            },
    
            _handleMessageBoxOpen: function (sMessage, sMessageBoxType) {
                sap.m.MessageBox[sMessageBoxType](sMessage, {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction === sap.m.MessageBox.Action.YES) {
                            this._wizard.discardProgress(this._wizard.getSteps()[0]);
                            this.handleNavBackToList();
                        }
                    }.bind(this)
                });
            },
    
            handleNavBackToList: function () {
                this._navBackToStep(this.byId("ContentsStep"));
            },
    
            handleNavBackToPaymentType: function () {
                this._navBackToStep(this.byId("PaymentTypeStep"));
            },
    
            handleNavBackToCreditCard: function () {
                this._navBackToStep(this.byId("CreditCardStep"));
            },
    
            handleNavBackToCashOnDelivery: function () {
                this._navBackToStep(this.byId("CashOnDeliveryStep"));
            },
    
            handleNavBackToBillingAddress: function () {
                this._navBackToStep(this.byId("BillingStep"));
            },
    
            handleNavBackToDeliveryType: function () {
                this._navBackToStep(this.byId("DeliveryTypeStep"));
            },
    
            _navBackToStep: function (step) {
                var fnAfterNavigate = function () {
                    this._wizard.goToStep(step);
                    this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
                }.bind(this);
    
                this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
                this._oNavContainer.to(this._oDynamicPage);
            }
    
        });
    });
