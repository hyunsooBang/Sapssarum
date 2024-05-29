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
        var custno;
        
        
        return Controller.extend("cart.controller.Cart", {
            onInit: function () {
                //onInit 한번만 실행 
                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute("RouteCart").attachPatternMatched(this._onPatternMatched, this);

                this._wizard = this.byId("ShoppingCartWizard");
                this._oNavContainer = this.byId("navContainer");
                this._oDynamicPage = this.getPage();
                
                this.model = new JSONModel();
			//     this.model.attachRequestCompleted(null, function () {
            //     console.log('reqyest');
			// 	this.model.setProperty("/selectedPayment", "Credit Card");
			// 	this.model.setProperty("/selectedDeliveryMethod", "Standard Delivery");
			// 	this.model.setProperty("/differentDeliveryAddress", false);
			// 	this.model.setProperty("/CashOnDelivery", {});
			// 	this.model.setProperty("/BillingAddress", {});
			// 	this.model.setProperty("/CreditCard", {});
			// 	this.model.updateBindings();
			// }.bind(this));
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
                        var custno = oData.Custno;
                        // name 변수에 Custnm 값을 설정
                        console.log('name:',sCustnm);
                        console.log('name:',custno);
                        this.getView().getModel('data').setProperty("/name", sCustnm);
                        this.getView().getModel('data').setProperty("/custno",custno);
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
                var price ;
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
                this.updateDatabase();
                this.clearCartData();
                // this.saveJsonToDatabase();
                this.oRouter.navTo('RouteMain',{
                    'query' : {
                        // tab: 'okk',
                        // test: 10
                    }

                });
            
            },
           
            updateDatabase: function() {
                var oDataModel = this.getView().getModel();
                var oCustomerId = id;
                var oCart = this.getView().getModel('cart').getData(); // cart 데이터 가져오기
                var oFilter = new sap.ui.model.Filter("Custid", "EQ", oCustomerId);
                var aOriginData;
                var aUpdates;

                // 비활성화된 배치 처리 설정
                oDataModel.setUseBatch(false);
            
                // 필터링된 데이터를 읽기
                oDataModel.read("/ZBBT_SD110Set", {
                    filters: [oFilter],
                    success: function(oData) {
                        aOriginData = oData.results; // 기존 데이터
            
                        // cart에 있는 데이터와 비교하여 업데이트가 필요한 데이터 필터링
                        aUpdates = oCart.filter(function(oCartItem) {
                            var oOriginItem = aOriginData.find(function(oOriginItem) {
                                return oOriginItem.Matno === oCartItem.Matno;
                            });
                            return oOriginItem && oOriginItem.Quantity !== oCartItem.Quantity;
                        }).map(function(oCartItem) {
                            return {
                                Custid: oCustomerId,
                                Matno: oCartItem.Matno,
                                Quantity: oCartItem.Quantity,
                                Unit: oCartItem.Unit
                            };
                        });
            
                        console.log('update', aUpdates);
            
                        var iSuccessCount = 0;
                        var iErrorCount = 0;
                        var iProcessedCount = 0;
            
                        // 업데이트 실행
                        aUpdates.forEach(function(oUpdateItem) {
                            var sPath = oDataModel.createKey("/ZBBT_SD110Set", {
                                'Custid': oCustomerId,
                                'Matno': oUpdateItem.Matno
                            });
            
                            oDataModel.update(sPath, oUpdateItem, {
                                success: function() {
                                    iSuccessCount++;
                                    iProcessedCount++;
                                    if (iProcessedCount === aUpdates.length) {
                                        sap.m.MessageToast.show("데이터 업데이트 완료: " + iSuccessCount + "건");
                                        oDataModel.refresh(); // 모델을 새로고침하여 변경 사항을 반영
                                    }
                                },
                                error: function(oError) {
                                    iErrorCount++;
                                    iProcessedCount++;
                                    console.error("데이터 업데이트 실패: " + oError.message);
                                    if (iProcessedCount === aUpdates.length) {
                                        sap.m.MessageToast.show("데이터 업데이트 실패: " + iErrorCount + "건");
                                        oDataModel.refresh(); // 모델을 새로고침하여 변경 사항을 반영
                                    }
                                }
                            });
                        });
                    },
                    error: function() {
                        sap.m.MessageToast.show("데이터 읽기 실패");
                    }
                });
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
                var sMatno = listItem.getBindingContext("cart").getProperty("Matno");
            
                sap.m.MessageBox.confirm("장바구니에서 '" + sMatnm + "'을(를) 삭제하시겠습니까?", {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.YES) {
                            var aCartItems = oModel.getData();
                            aCartItems = aCartItems.filter(function (item) {
                                return item.Matnm !== sMatnm;
                            });
                            oModel.setData(aCartItems);
                            this.calcTotal();
                            this.onDeleteCartItem(sMatno);
                        }
                    }.bind(this)
                });
            },
            
            onDeleteCartItem: function(matno) {
                //데이터 삭제
                //delete 요청: "/Products('1000')"
                var oDataModel = this.getView().getModel();
                
                var sPath = oDataModel.createKey("/ZBBT_SD110Set",{
                    "Custid" : id,
                    "Matno" : matno
                });
                oDataModel.remove(sPath, {
                    success: function(oReturn) {
                        console.log("삭제",oReturn)
                    }
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
            
            setDifferentDeliveryAddress: function (oEvent) {
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
                this.checkBillingStep();
                
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
                this._handleMessageBoxOpen("주문 요청을 제출하시겠습니까 ?", "confirm");
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
            checkCart: function () {
                var oCart = this.getView().getModel('cart');
                if (oCart == false ) {
                    this._wizard.invalidateStep(this.byId("PaymentTypeStep"));
                } else {
                    this._wizard.validateStep(this.byId("PaymentTypeStep"));
                }
            },
    
            completedHandler: function () {
                this._oNavContainer.to(this.byId("wizardBranchingReviewPage"));
            },
            
            _handleMessageBoxOpen: function (sMessage, sMessageBoxType) {
                sap.m.MessageBox[sMessageBoxType](sMessage, {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction === sap.m.MessageBox.Action.YES && sMessageBoxType === 'confirm') {
                            this.saveOrder()
                                .then(this.onDeleteCart.bind(this))
                                .then(() => {
                                    this._wizard.discardProgress(this._wizard.getSteps()[0]);
                                    this.handleNavBackToList();
                                    this.loadCartItemsData();
                                    this.clearCartData();
                                })
                                .catch((error) => {
                                    console.error("An error occurred:", error);
                                });
                        } else if (oAction === sap.m.MessageBox.Action.YES && sMessageBoxType === 'warning') {
                            this._wizard.discardProgress(this._wizard.getSteps()[0]);
                            this.handleNavBackToList();
                            this.clearCartData();
                        }
                    }.bind(this)
                });
            }
            ,
            

            formatDate: function(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 1을 더해줍니다.
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
              },

              saveOrder: function() {
                return new Promise((resolve, reject) => {
                    var cdate = this.formatDate(new Date());
                    var oDataModel = this.getView().getModel();
                    var oData = this.getView().getModel('data').getData();
                    var oCart = this.getView().getModel('cart').getData();
                    var oCust = this.getView().getModel('cust').getData();
                    var orderno;
            
                    oDataModel.setUseBatch(false);
            
                    var oHeaderBody = {
                        'Custno': oData.custno,
                        'Orderty': "0",
                        'Orderdate': cdate,
                        'Ptotal': oData.ProductsTotalPrice.replace(/,/g, ''),
                        'Currency': "KRW",
                        'Shipadd': oCust.address + ' ' + oCust.detailAddress,
                        'Ordstat': "0"
                    };
            
                    oDataModel.create('/ZBBT_SD040_CARTSet', oHeaderBody, {
                        success: (oHeader) => {
                            console.log('Header saved:', oHeader);
            
                            var sOrderPath = "/ZBBT_SD040_CARTITEMSet";
                            var oFilter1 = new sap.ui.model.Filter("Custno","EQ", oData.custno);
                            oDataModel.read(sOrderPath, {
                                filters: [oFilter1],
                                success: (oData) => {
                                    orderno = oData.results[0].Orderno;
                                    var aCartItems = [];
            
                                    if (oCart) {
                                        aCartItems = oCart.map(item => ({
                                            Orderno: orderno,
                                            Matno: item.Matno,
                                            Quantity: item.Quantity,
                                            Unit: item.Unit,
                                            Pdtotal: item.TotalPrice.toString(),
                                            Currency: 'KRW'
                                        }));
            
                                        Promise.all(aCartItems.map(cartItem => {
                                            return new Promise((resolve, reject) => {
                                                oDataModel.create("/ZBBT_SD050Set", cartItem, {
                                                    success: () => {
                                                        console.log('Item saved:', cartItem);
                                                        resolve();
                                                    },
                                                    error: (oError) => {
                                                        console.log("Error saving item: ", cartItem, oError);
                                                        reject(oError);
                                                    }
                                                });
                                            });
                                        })).then(resolve).catch(reject);
                                    } else {
                                        resolve();
                                    }
                                },
                                error: (oError) => {
                                    console.log("Error reading order number: ", oError);
                                    reject(oError);
                                }
                            });
                        },
                        error: (oError) => {
                            console.log("Error creating header: ", oError);
                            reject(oError);
                        }
                    });
                });
            }
            ,

            onDeleteCart: function() {
                return new Promise((resolve, reject) => {
                    var oDataModel = this.getView().getModel();
                    //var id = this.getView().getModel('cust').getData().custid; // 적절한 ID 가져오기
                    var oFilter = new sap.ui.model.Filter("Custid", "EQ", id);
            
                    oDataModel.setUseBatch(false);
                    oDataModel.read("/ZBBT_SD110Set", {
                        filters: [oFilter],
                        success: (oData) => {
                            var aItemsToDelete = oData.results;
                            
                            Promise.all(aItemsToDelete.map(item => {
                                return new Promise((resolve, reject) => {
                                    var sPath = oDataModel.createKey("/ZBBT_SD110Set", {
                                        'Custid': item.Custid,
                                        'Matno': item.Matno
                                    });
            
                                    oDataModel.remove(sPath, {
                                        success: () => {
                                            console.log('Item deleted:', item);
                                            resolve();
                                        },
                                        error: (oError) => {
                                            console.log("Error deleting item: ", item, oError);
                                            reject(oError);
                                        }
                                    });
                                });
                            })).then(resolve).catch(reject);
                        },
                        error: (oError) => {
                            console.log("Error reading data: ", oError);
                            reject(oError);
                        }
                    });
                });
            }
            ,

            clearCartData: function(){
                this.getView().getModel('data').setProperty('/CardName','');
                this.getView().getModel('data').setProperty('/CardNumber','');
                this.getView().getModel('data').setProperty('/CardCode','');
                this.getView().getModel('data').setProperty('/CardExpire','');
                this.getView().getModel('cust').setData({
                    address: "",
                    detailAddress: "",
                    phoneNumber: "",
                    recipientName: "",
                    memo: ""
                });
                this.getView().getModel('data').setProperty('/differentDeliveryAddress',false);
               

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
