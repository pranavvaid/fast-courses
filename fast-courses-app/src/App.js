import React, { useState, useEffect, useRef } from 'react';
import {
  InstantSearch,
  SearchBox,
  Pagination,
  ClearRefinements,
  RefinementList,
  Panel,
  Stats,
  SortBy,
  RangeInput,
} from 'react-instantsearch-dom';
import qs from 'qs';
import ReactGA from 'react-ga';

import IconButton from './partials/IconButton';
import Hits from './partials/Hits';
import RightPanel from './partials/RightPanel';
import ReactSidebar from "react-sidebar";

import { useAuth } from './auth';
import { searchClient, useStore } from './store';
import * as util from './util';

import 'instantsearch.css/themes/algolia.css';
import './App.css';

const DEBOUNCE_TIME = 400;

const createURL = state => {
  if (state.pages === 1) { delete state.pages; }
  return `?${qs.stringify(state)}`;
};

const searchStateToUrl = ({ location }, searchState) =>
  searchState ? `${location.pathname}${createURL(searchState)}` : '';

const urlToSearchState = ({ search }) => qs.parse(search.slice(1));

const Sticky = ({ className, children }) => {
  return <div className={`${className} sticky`}>{children}</div>;
};

const Header = React.forwardRef(({ user, onTitleClick, ...rest }, ref) => (
  <header className="header" ref={ref} {...rest}>
    <h1 className="header-title">
      <a href="/" onClick={e => { if (!e.metaKey) { e.preventDefault(); onTitleClick(); } }}>fast-courses<span>▸</span></a>
    </h1>
    <p className="header-subtitle">
      a better way to search Stanford courses* <span className="mobile-note"></span>
    </p>
    <p className="header-user">{user.name}</p>
  </header>
));

const sortTerms = items => util.sortTerms(items, t => t.label);
const sortScheduleDays = items =>
  items.map(item => ({
    ...item,
    label: util.formatDays(item.label),
  }));
const sortUnits = items => {
  let res = items.sort((a,b) => +a.label - +b.label).map(item => ({
    ...item,
    label: `${item.label} unit${item.label === '1' ? '' : 's'}`
  }));
  return res;
};

const App = ({ location, history }) => {
  const { user } = useAuth({ autoAuthenticate: true });
  const [searchState, setSearchState] = useState(urlToSearchState(location));
  const [debouncedSetState, setDebouncedSetState] = useState(null);
  const ref = useRef(null);

  const isMobile = util.useMedia(['(max-width: 980px)'], [true], false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Trigger an initial state change to update log
  useEffect(() => {
    onSearchStateChange(searchState, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchStateChange = (updatedSearchState, initial) => {
    // Handle scroll
    if (!initial && ref && ref.current) {
      const top = ref.current.getBoundingClientRect().height + (isMobile ? 16 : 32);
      if (isMobile || window.scrollY >= top) {
        (isMobile ? document.getElementById('appContent') : window).scrollTo(0, top);
      }
    }

    // Debounced URL update
    clearTimeout(debouncedSetState);
    setDebouncedSetState(
      setTimeout(() => {
        history.push(searchStateToUrl({ location }, updatedSearchState), updatedSearchState);
      }, DEBOUNCE_TIME)
    );

    // Update rendered state
    setSearchState(updatedSearchState);

    // Analytics
    const page = `/?query=${updatedSearchState.query}`;
    ReactGA.set({ page: page });
    ReactGA.pageview(page);
  };

  const store = useStore({ user });

  // Render nothing until authenticated
  if (!user) {
    return <div />;
  }

  const SidebarContainer = isMobile ? 'div' : Sticky;

  const PageLeftPanel = (
    <SidebarContainer className="search-panel__filters">
      <div>
        <ClearRefinements />

        <Panel header="Term">
          <RefinementList
            attribute="sections.term"
            transformItems={sortTerms}
          />
        </Panel>

        <Panel header="WAYS / GERs">
          <RefinementList
            attribute="gers"
            searchable
            limit={5}
          />
        </Panel>

        <Panel header="Subject">
          <RefinementList
            attribute="subject"
            searchable
            limit={5}
          />
        </Panel>

        <Panel header="Instructor">
          <RefinementList
            attribute="sections.schedules.instructors.name"
            searchable
            limit={5}
          />
        </Panel>

        <Panel header="Schedule">
          <RefinementList
            attribute="sections.schedules.days"
            transformItems={sortScheduleDays}
          />
        </Panel>

        <Panel header="Units">
          <RefinementList
            attribute="units"
            limit={6}
            showMore
            transformItems={sortUnits}
          />
        </Panel>

        <Panel header="Course number">
          <RangeInput attribute="numberInt" />
        </Panel>

        <Panel header="Course suffix">
          <RefinementList
            attribute="numberSuffix"
            searchable
            limit={5}
            showMore
          />
        </Panel>

        <Panel header="Sort By">
          <SortBy
            defaultRefinement="courses"
            items={[
              { value: 'courses', label: 'Best match' },
              { value: 'courses_number_asc', label: 'Course number' },
            ]}
          />
        </Panel>
      </div>
    </SidebarContainer>
  );

  const PageRightPanel = (
    <SidebarContainer className="search-panel__right">
      <RightPanel updateSearchState={onSearchStateChange} getClassesForTerm={store.getClassesForTerm} />
    </SidebarContainer>
  );

  const PageContent = (
    <div>
      <style>{"#loader { display: none; }"}</style>
      <Header ref={ref} user={user} onTitleClick={() => onSearchStateChange({})} />
      <div className="search-panel">
        {!isMobile && PageLeftPanel}
        <div className="search-panel__results">
          <div className="search-panel__query">
            <div className="search-panel__searchbox">
              {isMobile && <IconButton icon="filter" onClick={() => setLeftOpen(true)} />}
              <SearchBox
                translations={{placeholder: "Search by course number, title, description, anything really..."}}
                showLoadingIndicator
              />
              {isMobile && <IconButton icon="calendar" onClick={() => setRightOpen(true)} />}
            </div>
            <div className="search-panel__stats"><Stats /></div>
          </div>

          <Hits store={store} />

          <div className="pagination">
            <Pagination />
          </div>

          <div className="attribution">
            <div>
              <a className="ais-Menu-link" href="https://github.com/theopolisme/fast-courses">open source</a>
              {' '}&middot;{' '}
              <a className="ais-Menu-link" href="mailto:tcp@stanford.edu">questions?</a>
            </div>
            <div>* not affiliated with Stanford University</div>
          </div>
        </div>
        {!isMobile && PageRightPanel}
      </div>
    </div>
  );

  let body;

  if (isMobile) {
    const sidebarStyles = {sidebar: {zIndex: 999}, overlay: {zIndex: 998}};
    body = (
      <ReactSidebar open={leftOpen} onSetOpen={setLeftOpen} sidebar={PageLeftPanel} styles={sidebarStyles}>
      <ReactSidebar open={rightOpen} onSetOpen={setRightOpen} pullRight sidebar={PageRightPanel} styles={sidebarStyles} contentId="appContent">
        {PageContent}
      </ReactSidebar>
      </ReactSidebar>
    );
  } else {
    body = <div id="appContent">{PageContent}</div>;
  }

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName="courses"
      searchState={searchState}
      onSearchStateChange={onSearchStateChange}
      createURL={createURL}
    >
      {body}
    </InstantSearch>
  );
};

export default App;
