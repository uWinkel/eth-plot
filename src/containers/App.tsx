import { withStyles } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter, Route, RouteComponentProps, Switch } from 'react-router-dom';
import { bindActionCreators, Dispatch } from 'redux';

import { AllActions } from '../actions';
import * as AccountActions from '../actionCreators/AccountActions';
import * as DataActions from '../actionCreators/DataActions';
import * as GridActions from '../actionCreators/GridActions';
import * as PurchaseActions from '../actionCreators/PurchaseActions';
import About from '../components/About';
import MetaMaskStatus from '../components/MetaMaskStatus';
import Nav, { NavProps } from '../components/Nav';
import ProgressSpinner from '../components/ProgressSpinner';
import * as Enums from '../constants/Enums';
import * as Reducers from '../reducers';
import { RootState } from '../reducers';

import AccountManagerContainer from './AccountManagerContainer';
import MainContainer, { MainContainerProps } from './MainContainer';
import TransactionManagerContainer from './TransactionManagerContainer';

// tslint:disable-next-line:variable-name
const Web3 = require('web3');

declare global {
  interface Window { web3: any; }
}

interface AppDataProps {
  account: Reducers.AccountState;
  data: Reducers.DataState;
  grid: Reducers.GridState;
  purchase: Reducers.PurchaseState;
  purchaseDialog: Reducers.PurchaseDialogState;
  imageToPurchase: Reducers.ImageToPurchaseState;
}

interface AppActionProps {
  actions: AllActions;
} 

export interface AppProps extends RouteComponentProps<any> {
  account: Reducers.AccountState;
  data: Reducers.DataState;
  grid: Reducers.GridState;
  purchase: Reducers.PurchaseState;
  purchaseDialog: Reducers.PurchaseDialogState;
  imageToPurchase: Reducers.ImageToPurchaseState;
  actions: AllActions;
}

// export type AppProps = AppDataProps & AppActionProps extends;


/**
 * It is common practice to have a 'Root' container/component require our main App (this one).
 * Again, this is because it serves to wrap the rest of our application with the Provider
 * component to make the Redux store available to the rest of the app.
 */
class App extends React.Component<AppProps> { 
  private accountInterval: number;

  componentDidMount() {
    this.checkMetamaskStatus();

    /**
     * The following timer is the MetaMask recommended way of checking for 
     * changes to MetaMask.  There are three possible states:
     *  1) A user doesn't have MetaMask installed.
     *  2) A user's MetaMask account is locked, they need to under a password to unlock.
     *  3) A user's account is open and ready for use.
     * 
     * More info available here: 
     * https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md
     */
    this.accountInterval = setInterval(
      () => {
        this.checkMetamaskStatus();
      },
      1000000); // TODO Toggle back on
  }

  checkMetamaskStatus() {
    if (typeof window.web3 !== 'undefined') {
      const newWeb3 = new Web3(window.web3.currentProvider);
      newWeb3.eth.getAccounts((error, accounts) => {
        if (accounts.length > 0) {
          this.props.actions.updateMetamaskState(Enums.METAMASK_STATE.OPEN);

          if (accounts[0] !== this.props.account.activeAccount) {
            // The only time we ever want to load data from the chain history
            // is when we receive a change in accounts - this happens anytime 
            // the page is initially loaded or if there is a change in the account info
            // via a metamask interaction.
            this.appDataBootstrap();
            this.props.actions.updateActiveAccount(accounts[0]);
          }
        } else {
          this.props.actions.updateMetamaskState(Enums.METAMASK_STATE.LOCKED);
        }
      });
    } else {
      this.props.actions.updateMetamaskState(Enums.METAMASK_STATE.UNINSTALLED);
    }
  }

  // Fetches all data needed for application - this happens when the app
  // first loads and also when metamask state changes
  appDataBootstrap() {  
    this.props.actions.fetchPlotsFromWeb3(this.props.data.contractInfo);

    if (typeof window.web3 !== 'undefined') {
      const newWeb3 = new Web3(window.web3.currentProvider);
      newWeb3.eth.getAccounts((error, accounts) => {
        this.props.actions.fetchAccountTransactions(this.props.data.contractInfo, accounts[0]);
      });
    }
  }

  // Returns true if we have finished loading all the data we need to and 
  // know the current user's metamask state.
  shouldShowSpinner() {
    return (this.props.data.isFetchingPlots ||
            this.props.account.isFetchingTransactions ||
            !this.props.account.metamaskStateKnown);
  }

  componentWillUnmount() {
    clearInterval(this.accountInterval);
  }

  clearNotifications() {
    this.props.actions.clearNotificationCount();
  }

  doNavigation(to: string) {
    this.props.history.push(to);
  }

  getMainBodyContent() {
    const { actions, purchase } = this.props;
    const mainContainerProps = {
      classes: {},
      actions: {
        purchaseImageSelected: actions.purchaseImageSelected,
        goToPurchaseStep: actions.goToPurchaseStep,
        completePurchaseStep: actions.completePurchaseStep,
        changePlotWebsite: actions.changePlotWebsite,
        changePlotBuyout: actions.changePlotBuyout,
        changeBuyoutEnabled: actions.changeBuyoutEnabled,
        completePlotPurchase: actions.completePlotPurchase,
        hoverOverPlot: actions.hoverOverPlot,
        startTransformRectToPurchase: actions.startTransformRectToPurchase,
        stopTransformRectToPurchase: actions.stopTransformRectToPurchase,
        transformRectToPurchase: actions.transformRectToPurchase,
        togglePurchaseFlow: actions.togglePurchaseFlow,
        changeZoom: actions.changeZoom
      },
      purchase: // this.props.purchase,
      {
        rectToPurchase: purchase.rectToPurchase,
        purchasePriceInWei: purchase.purchasePriceInWei,
        activeStep: purchase.activeStep,
        completedSteps: purchase.completedSteps,
        imageName: purchase.imageName,
        imageDimensions: purchase.imageDimensions,
        website: purchase.website,
        buyoutPriceInWei: purchase.buyoutPriceInWei,
        buyoutEnabled: purchase.buyoutEnabled,
        purchaseFlowOpen: purchase.purchaseFlowOpen,
        currentTransform: purchase.currentTransform
      },
      imageFileInfo: this.props.imageToPurchase.imageFileInfo,
      plots: this.props.data.plots,
      contractInfo: this.props.data.contractInfo,
      scale: this.props.grid.scale,
      gridInfo: this.props.data.gridInfo,
      hoveredIndex: this.props.grid.hoveredIndex,
      dragRectCurr: this.props.grid.dragRectCurr,
      dragRectStart: this.props.grid.dragRectStart,
      isDraggingRect: this.props.grid.isDraggingRect,
      purchaseDialog: {
        cancelPlotPurchase: actions.cancelPlotPurchase,
        purchaseStage: this.props.purchaseDialog.purchaseStage,
        isShowing: this.props.purchaseDialog.isShowing
      }
    };


    return (
      <Switch>
        <Route exact path="/" render={(routeProps) => (
          <MainContainer {...mainContainerProps} {...routeProps}/>
        )}/>
        <Route path="/myplots" render={(routeProps) => (
          <AccountManagerContainer 
            {...routeProps} {...this.props.data} {...this.props.account} actions={this.props.actions} />
        )}/>
        <Route path="/about" component={About}/>
        <Route path="/account" render={(routeProps) => (
        <TransactionManagerContainer {...routeProps} {...this.props.account} />
        )}/>
      </Switch>
    );
  }

  render() {
    const navProps: NavProps = {
      classes: {},
      notificationCount: this.props.account.notificationCount,
      clearNotifications: this.clearNotifications.bind(this),
      doNavigation: to => this.doNavigation(to)
    };

    const mainBodyContent = this.getMainBodyContent();
    return (
      <div className="main-app-container">
        <Nav {...navProps} />
        <main>
          {
            (this.shouldShowSpinner()) ?
            <ProgressSpinner classes={{}} /> :
              (this.props.account.metamaskState !== Enums.METAMASK_STATE.OPEN) ?
              <MetaMaskStatus metamaskState={this.props.account.metamaskState} classes={{}} /> :
              mainBodyContent
          }
        </main>
      </div>
    );
  }
}

/**
 * Global redux state.
 */
function mapStateToProps(state: RootState) {
  // console.log(state);
  return {
    account: state.account,
    data: state.data,
    grid: state.grid,
    purchase: state.purchase,
    imageToPurchase: state.imageToPurchase,
    purchaseDialog: state.purchaseDialog
  };
}

/**
 * Turns an object whose values are 'action creators' into an object with the same
 * keys but with every action creator wrapped into a 'dispatch' call that we can invoke
 * directly later on. Here we imported the actions specified in 'CounterActions.js' and
 * used the bindActionCreators function Redux provides us.
 *
 * More info: http://redux.js.org/docs/api/bindActionCreators.html
 */
function mapDispatchToProps(dispatch: Dispatch<any>) {
  return {
    actions: bindActionCreators(Object.assign({}, AccountActions, DataActions, GridActions, PurchaseActions), dispatch)
  };
}

/**
 * 'connect' is provided to us by the bindings offered by 'react-redux'. It simply
 * connects a React component to a Redux store. It never modifies the component class
 * that is passed into it, it actually returns a new connected componet class for use.
 *
 * More info: https://github.com/rackt/react-redux
 * 
 * The withRouter wrapper ensures routes are properly updated.  More info here: 
 * https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/redux.md
 */

export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(App));
