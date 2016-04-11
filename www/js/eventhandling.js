/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Overrides default mouse events. Two main reasons:
 * 1: Processing.js version > 1.4.1 (at least up to 1.4.16) unable to handle
 *    touch events. No meaningful interraction thus possible for newer libs.
 * 2: Sluggish reactions. A click uses about 0.3 seconds before it is
 *    registered as a click.
 */

// ----------------------------------------------------------------------------
// --- Workaround to treat touch events as mouse events ---
// ----------------------------------------------------------------------------

// This file has the limitation that it only tracks one single touch event at any time.

plab.eventOverrides = {
	// Remember last start event target (only click when start target is same as end target)
	lastStartTarget : null,
	// To avoid clicking when touch has been moved a substancial amount, track where event started
	screenStart : { x : 0, y : 0},
	// Max squared distance, in screen pixel coordinates, from start position before a click is not produced
	sqMaxDist : 1600,

	touchToMouseDispatch : function(type, evt) {
		// Should use new MouseEvent, but this fails. So initMouseEvent is used:
		var mev = document.createEvent("MouseEvents");
		var t = evt.changedTouches[0];
		mev.initMouseEvent(type, true, true, window, 1,
			t.screenX, t.screenY, t.clientX, t.clientY,
			evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, 0, null
		);
		// Tells if this event should be allowed to progress
		mev.manualDispatch = true;
		// Do the new dispatch:
		evt.target.dispatchEvent(mev);
	},

	killNonSelfDispatched : function(evt) {
		if (!evt.manualDispatch) {
			evt.stopPropagation();
			plab.out.notify.println("Event KILLED");
		}
	},

	updateEventOverrideListeners : function() {
		plab.out.notify.println("Update touch-to-mouse listeners");
		var b = document.body;
		// All mouse events are simulated: down, up, click and move
		// Those that are not simulated should be killed before they hit their target!
		b.removeEventListener("mousedown", plab.eventOverrides.killNonSelfDispatched, true);
		b.addEventListener("mousedown", plab.eventOverrides.killNonSelfDispatched, true);
		b.removeEventListener("mouseup", plab.eventOverrides.killNonSelfDispatched, true);
		b.addEventListener("mouseup", plab.eventOverrides.killNonSelfDispatched, true);
		b.removeEventListener("mousemove", plab.eventOverrides.killNonSelfDispatched, true);
		b.addEventListener("mousemove", plab.eventOverrides.killNonSelfDispatched, true);
		b.removeEventListener("click", plab.eventOverrides.killNonSelfDispatched, true);
		b.addEventListener("click", plab.eventOverrides.killNonSelfDispatched, true);

		// Touch events should generate mouse events: allow:
		b.removeEventListener("touchstart", plab.eventOverrides.handleTouchStart);
		b.addEventListener("touchstart", plab.eventOverrides.handleTouchStart);
		b.removeEventListener("touchend", plab.eventOverrides.handleTouchEnd);
		b.addEventListener("touchend", plab.eventOverrides.handleTouchEnd);
		b.removeEventListener("touchcancel", plab.eventOverrides.handleTouchCancel);
		b.addEventListener("touchcancel", plab.eventOverrides.handleTouchCancel);
		b.removeEventListener("touchmove", plab.eventOverrides.handleTouchMove);
		b.addEventListener("touchmove", plab.eventOverrides.handleTouchMove);
		plab.out.notify.println("Update listeners complete");
	},

	handleTouchStart : function(evt) {
		// Remember the target:
		plab.eventOverrides.lastStartTarget = evt.target;
		// Remember the position
		plab.eventOverrides.screenStart.x = evt.changedTouches[0].screenX;
		plab.eventOverrides.screenStart.y = evt.changedTouches[0].screenY;
		// Dispatch a move to the current position
		plab.eventOverrides.touchToMouseDispatch("mousemove", evt);
		// Dispatch mouse event
		plab.eventOverrides.touchToMouseDispatch("mousedown", evt);
	},
	handleTouchEnd : function(evt) {
		// Dispatch mouse event
		plab.eventOverrides.touchToMouseDispatch("mouseup", evt);
		// Should we simulate a click?
		// 1: Do we have the same target?
		if (evt.target === plab.eventOverrides.lastStartTarget) {
			var mDistX = plab.eventOverrides.screenStart.x - evt.changedTouches[0].screenX;
			var mDistY = plab.eventOverrides.screenStart.y - evt.changedTouches[0].screenY;
			// 2: Is moved distance from start not too far away?
			if ((mDistX * mDistX + mDistY * mDistY) <= plab.eventOverrides.sqMaxDist) {
				plab.eventOverrides.touchToMouseDispatch("click", evt);
			}
		}
		plab.eventOverrides.lastStartTarget = null;
	},
	handleTouchMove : function(evt) {
		// Dispatch mouse event
		plab.eventOverrides.touchToMouseDispatch("mousemove", evt);
	},
	handleTouchCancel : function(evt) {
		// We reuse the end handler, but hold this here in case we wish to change behaviour in the future
		plab.eventOverrides.handleTouchEnd(evt);
	}
};

// ----------------------------------------------------------------------------
// --- Touch event workaround end ---
// ----------------------------------------------------------------------------
