/*
Copyright 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import React from 'react';
const MemberAvatar = require('../avatars/MemberAvatar.js');

module.exports = React.createClass({
    displayName: 'MemberEventListSummary',

    propTypes: {
        // An array of member events to summarise
        events: React.PropTypes.array.isRequired,
        // An array of EventTiles to render when expanded
        children: React.PropTypes.array.isRequired,
        // The maximum number of names to show in either the join or leave summaries
        summaryLength: React.PropTypes.number,
        // The maximum number of avatars to display in the summary
        avatarsMaxLength: React.PropTypes.number,
        // The minimum number of events needed to trigger summarisation
        threshold: React.PropTypes.number,
    },

    getInitialState: function() {
        return {
            expanded: false,
        };
    },

    getDefaultProps: function() {
        return {
            summaryLength: 3,
            threshold: 3,
            avatarsMaxLength: 5
        };
    },

    _toggleSummary: function() {
        this.setState({
            expanded: !this.state.expanded,
        });
    },

    _getEventSenderName: function(ev) {
        if (!ev) {
            return 'undefined';
        }
        return ev.sender.name || ev.event.content.displayname || ev.getSender();
    },

    _renderNameList: function(events) {
        if (events.length === 0) {
            return null;
        }
        let originalNumber = events.length;
        events = events.slice(0, this.props.summaryLength);
        let lastEvent = events.pop();

        let names = events.map((ev) => {
            return this._getEventSenderName(ev);
        }).join(', ');

        if (names.length === 0) {
            return this._getEventSenderName(lastEvent);
        }

        // Special case the last name. ' and ' might be included later
        // So you have two cases:
        if (originalNumber <= this.props.summaryLength) {
            // name1, name2 and name3
            names += ' and ';
        } else {
            // name1, name2, name3 [and 100 others]
            names += ', ';
        }

        let remaining = originalNumber - this.props.summaryLength;
        let remainingDesc = (remaining > 0 ? 'and ' + remaining + ' others ':'');

        return names + this._getEventSenderName(lastEvent) + remainingDesc;
    },

    _renderSummary: function(joinEvents, leaveEvents) {
        let joiners = this._renderNameList(joinEvents);
        let leavers = this._renderNameList(leaveEvents);

        let joinSummary = null;
        if (joiners) {
            joinSummary = (
                <span>
                    {joiners} joined the room
                </span>
            );
        }
        let leaveSummary = '';
        if (leavers) {
            leaveSummary = (
                <span>
                    {leavers} left the room
                </span>
            );
        }
        return (
            <span>
                {joinSummary}{joinSummary && leaveSummary?'; ':''}
                {leaveSummary}
            </span>
        );
    },

    _renderAvatars: function(events) {
        let avatars = events.slice(0, this.props.avatarsMaxLength).map((e) => {
            return (
                <MemberAvatar
                    key={e.getId()}
                    member={e.sender}
                    width={14}
                    height={14}
                />
            );
        });

        return (
            <span>
                {avatars}
            </span>
        );
    },

    render: function() {
        let summary = null;

        // Reorder events so that joins come before leaves
        let eventsToRender = this.props.events;

        // Filter out those who joined, then left
        let filteredEvents = eventsToRender.filter(
            (e) => {
                return eventsToRender.filter(
                    (e2) => {
                        return e.getSender() === e2.getSender()
                            && e.event.content.membership !== e2.event.content.membership;
                    }
                ).length === 0;
            }
        );

        let joinAndLeft = (eventsToRender.length - filteredEvents.length) / 2;
        if (joinAndLeft <= 0 || joinAndLeft % 1 !== 0) {
            joinAndLeft = null;
        }

        let joinEvents = filteredEvents.filter((ev) => {
            return ev.event.content.membership === 'join';
        });

        let leaveEvents = filteredEvents.filter((ev) => {
            return ev.event.content.membership === 'leave';
        });

        let fewEvents = eventsToRender.length < this.props.threshold;
        let expanded = this.state.expanded || fewEvents;
        let expandedEvents = null;

        if (expanded) {
            expandedEvents = this.props.children;
        }

        let avatars = this._renderAvatars(joinEvents.concat(leaveEvents));

        let toggleButton = null;
        let summaryContainer = null;
        if (!fewEvents) {
            summary = this._renderSummary(joinEvents, leaveEvents);
            toggleButton = (
                <a onClick={this._toggleSummary}>{expanded?'collapse':'expand'}</a>
            );
            let noun = (joinAndLeft === 1 ? 'user' : 'others');

            summaryContainer = (
                <div className="mx_EventTile_line">
                    <div className="mx_EventTile_info">
                        <span className="mx_MemberEventListSummary_avatars">
                            {avatars}
                        </span>
                        <span className="mx_TextualEvent mx_MemberEventListSummary_summary">
                            {summary}{joinAndLeft? '. ' + joinAndLeft + ' ' + noun + ' joined and left' : ''}
                        </span>&nbsp;
                        {toggleButton}
                    </div>
                </div>
            );
        }

        return (
            <div className="mx_MemberEventListSummary">
                {summaryContainer}
                {expandedEvents}
            </div>
        );
    },
});