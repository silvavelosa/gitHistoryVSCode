import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ResultActions } from '../../actions/results';
import SplitPane from 'react-split-pane';
import Header from '../../components/Header';
import Commit from '../../components/LogView/Commit';
import LogView from '../../components/LogView/LogView';
import { ISettings } from '../../definitions';
import { LogEntriesState, RootState } from '../../reducers';
import { IConfiguration } from '../../reducers/vscode';
import Footer from '../../components/Footer';

type AppProps = {
    configuration: IConfiguration;
    settings: ISettings;
    logEntries: LogEntriesState;
    getCommits: typeof ResultActions.getCommits;
    getPreviousCommits: typeof ResultActions.getPreviousCommits;
    getNextCommits: typeof ResultActions.getNextCommits;
    search: typeof ResultActions.search;
} & typeof ResultActions;

interface AppState {}

class App extends React.Component<AppProps, AppState> {
    private splitPane;
    private prevSplitterPos;

    constructor(props?: AppProps, context?: any) {
        super(props, context);

        this.splitPane = React.createRef();
        this.prevSplitterPos = '50%';
    }

    private goBack = async () => {
        await this.props.getPreviousCommits();
        document.getElementById('scrollCnt').scrollTo(0, 0);
    };
    private goForward = async () => {
        await this.props.getNextCommits();
        document.getElementById('scrollCnt').scrollTo(0, 0);
    };

    componentDidUpdate(prevProps, prevState) {
        if (this.props.logEntries.selected != prevProps.logEntries.selected) {
            debugger;
            if (!this.props.logEntries.selected) {
                this.prevSplitterPos = this.props.configuration.sideBySide
                    ? this.splitPane.current.pane1.style.width
                    : this.splitPane.current.pane1.style.height;
                if (this.props.configuration.sideBySide) this.splitPane.current.pane1.style.width = '100%';
                else this.splitPane.current.pane1.style.height = '100%';
            } else {
                if (this.props.configuration.sideBySide)
                    this.splitPane.current.pane1.style.width = this.prevSplitterPos;
                else this.splitPane.current.pane1.style.height = this.prevSplitterPos;
            }
        }
    }

    onSplitterChanged(s) {
        this.prevSplitterPos = s;
    }

    public render() {
        const { children } = this.props;
        const canGoForward =
            this.props.logEntries.count === -1 ||
            (this.props.logEntries.pageIndex + 1) * this.props.configuration.pageSize < this.props.logEntries.count;
        return (
            <div className="appRootParent">
                <div className="appRoot">
                    <Header></Header>
                    <SplitPane
                        ref={this.splitPane}
                        split={this.props.configuration.sideBySide ? 'vertical' : 'horizontal'}
                        onChange={this.onSplitterChanged.bind(this)}
                        pane1Style={{ overflowY: 'auto' }}
                        defaultSize="100%"
                        style={{ paddingTop: '40px' }}
                        primary="first"
                    >
                        <LogView logEntries={this.props.logEntries} configuration={this.props.configuration}></LogView>
                        {this.props.logEntries && this.props.logEntries.selected ? (
                            <Commit />
                        ) : (
                            <div className="detail-view-info">
                                <div>Pick a commit from the list to view details</div>
                            </div>
                        )}
                    </SplitPane>
                    <Footer
                        canGoBack={this.props.logEntries.pageIndex > 0}
                        canGoForward={canGoForward}
                        goBack={this.goBack}
                        goForward={this.goForward}
                    ></Footer>
                </div>
                {children}
            </div>
        );
    }
}

function mapStateToProps(state: RootState) {
    return {
        configuration: state.vscode.configuration,
        settings: state.settings,
        logEntries: state.logEntries,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        ...bindActionCreators({ ...ResultActions }, dispatch),
        getCommits: () => dispatch(ResultActions.getCommits()),
        getNextCommits: () => dispatch(ResultActions.getNextCommits()),
        getPreviousCommits: () => dispatch(ResultActions.getPreviousCommits()),
        search: (text: string) => dispatch(ResultActions.search(text)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
