import { store } from "../main.js";
import { score } from "../score.js";
import { embed, getLevelThumbnail } from "../util.js";
import { fetchChangelog, fetchEditors, fetchList, fetchdailylul, fetchDates } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div style="display: flex; gap: 1em;">
                    <button @click="showTimeMachine = true" class="btn">
                        <img src="assets/calendar.svg" alt="calender" style="filter: var(--the-button-on-top);">
                    </button>
                    <input v-model="searchQuery" placeholder="Input text to Filter! here..." class="btn" type="text" id="filterForLevelName" style="width: 80%;">
                </div>
                <div v-if="showTimeMachine" style="display: inline; z-index: 2; position: fixed; inset: 50%; background-color: #000000aa; overflow: auto; width: 100%; height: 100%; margin: auto; left: 0;">
                        <div style="display: inline; z-index: 3; position: fixed; inset: 50%; background-color: var(--color-background); overflow: auto; width: 50%; height: 80%; border: 4px solid var(--color-primary); border-radius: 2em; justify-self: center; align-self: center; padding: 1em;">
                            <div style="display: flex;">
                                <a style="z-index: 4;" @click="showTimeMachine = false">
                                        <img src="../assets/back.svg" style="filter: brightness(0.5); height: 1.5rem;">
                                </a>
                                <h1 style="margin: auto;">Time machine thing</h1>
                            </div>
                            <p style="text-align: center; padding-top: 1em;">Select a date here!</p>
                            <div>
                            <button class="leaderboard-button" style="margin: auto; margin-block: 1em; display: flex;" onclick="window.location.href='?time=now'">Current Day</button>
                                <template v-for="date in dates.slice().reverse()">
                                    <button class="leaderboard-button" style="margin: auto; margin-block: 1em; display: flex;" :onclick="\`window.location.href='?time=\${date}'\`" v-text="\`\${new Date(Number(date.concat('000'))).toLocaleString()}\`"></button>
                                </template>
                            </div>
                        </div>
                    </div>
                <table class="list" v-if="list && list.length" style="margin-top: 1em;">
                    <tr v-for="(item, i) in filteredListDisplay" :key="item.originalIndex">
                        <template v-if="gamemodeAsked && item.level?.gamemode == gamemodeAsked || !gamemodeAsked || gamemodeAsked == 'all' || (gamemodeAsked == 'dual' && item.level?.gamemode)">
                            <td class="level" :class="{ 'active': selected === item.originalIndex, 'error': !item.level }">
                                    <button id="levelThumbnailReal" @click="selected = item.originalIndex" style="background-color: rgb(255 0 0 / 0); width: 100%; margin: 0.5em; display: flex; align-items: center; gap: 1rem;" :style="getLevelThumbnail(item.originalIndex, list)" :class="{ 'active': selected === item.originalIndex, 'error': !item.level, 'golden': item.level?.ullmarker &&  params.get('list') == 'impossible' }" class="btnlvl">
                                        <p style="white-space: nowrap; color: var(--color-on-background);">#{{ item.originalIndex + 1 }}</p>
                                        <div style="width: inherit;">
                                            <div style="display: flex">
                                                <span class="type-label-lg">{{ item.level?.name || \`Error (\${item.err}.json)\` }}</span>
                                                <span v-if="params.get('time')?.toLowerCase() != 'now' && params.get('time')" class="type-label-sm" style="font-style: italic; font-weight: 300; margin-left: 1rem;" v-text="\`currently #\${(listLatest ?? []).findIndex(([a]) => a?.name === item.level?.name) + 1 }\`"></span>
                                            </div>
                                            <div style="display: flex; padding-top: 0.5em;">
                                                <span v-if="item.level?.creators.length == 1" class="type-label-sm" style="font-style: italic; font-weight: 300;">{{ item.level?.creators[0] || "???" }}</span>
                                                <span v-else-if="item.level?.creators.length == 2" class="type-label-sm" style="font-style: italic; font-weight: 300;">{{ item.level?.creators[0] || "???" }}, {{ item.level?.creators[1] || "???" }}</span>
                                                <span v-else-if="item.level?.creators.length > 2" class="type-label-sm" style="font-style: italic; font-weight: 300;">{{ item.level?.creators[0] || "???" }}, {{ item.level?.creators[1] || "???" }}...</span>
                                            </div>
                                    </button>
                                </td> 
                            </template>
                    </tr>
                </table>
                <p v-if="list && list.length > 0 && filteredListDisplay && filteredListDisplay.length === 0" class="type-body-lg">
                    No levels found matching your search.
                </p>
            </div>
            <div class="level-container">
                <div class="level" v-if="level || selected != null">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Gamemode</div>
                            <p>{{ level.enjoyment || 'None (0)' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else-if="!selected" class="level" style="height: 100%; display: flex; justify-content: center; align-items: center; text-align: center;">
                    <h2>Welcome to the Orb SCL!</h2>
                    <p>Click the levels on the left side to see information about them! For more information about the submission rules check the right side!</p>
                    <p>Make sure to join the discord!</p>
                    <h2>Event</h2>
                    <p>{{ leDaily[0][0].name }} ({{ leDaily[0][0].id }})</p>
                    <button class="btn" @click="selected = Math.ceil(Math.random() * list.length)">
                        <span class="type-label-lg">I'm feeling lucky</span>
                    </button>
                    <button class="btn" @click="showFilter = !showFilter">
                    	<h2 v-if="showFilter">Select Filters ⏶</h2>
                        <h2 v-else>Select Filters ⏷</h2>
					</button>
					<form v-if="showFilter" action="#" class="type-label-lg" style="border: solid 0.25em var(--color-on-primary); border-radius: 1em; padding: 1em;">
						<div style="align-items: center;">
                            <div style="margin: 0.5em;">
                                <label for="gamemode">pick gamemode:  </label>
                                <select class="btn" v-model="gamemodeSelected" id="gamemode" name="gamemode">
                                    <option class="type-label-lg" value="All" selected>Any Gamemode</option>
                                    <option class="type-label-lg" value="cube">Cube</option>
                                    <option class="type-label-lg" value="ship">Ship</option>
                                    <option class="type-label-lg" value="ball">Ball</option>
                                    <option class="type-label-lg" value="uFO">UFO</option>
                                    <option class="type-label-lg" value="wave">Wave</option>
                                    <option class="type-label-lg" value="robot">Robot</option>
                                    <option class="type-label-lg" value="spider">Spider</option>
                                    <option class="type-label-lg" value="swing">Swing</option>
                                    <option class="type-label-lg" value="dual">Dual</option>
                                </select>
                            </div>
					    	<button class="btn" type="submit">Filter!</button>
						</div>
					</form>
                    <button class="btn" style="font-family: 'Lexend Deca', sans-serif;" @onclick="location.search = undefined">Reset Filter!</button>
                    <h2>Changelog</h2>
                    <main style="display: flex; flex-direction: column; align-items: left; gap: 24px; text-align: left; overflow: hidden; overflow-y: auto; max-height: 300px; width: 700px; border: 3px solid var(--color-primary); border-radius: 5px;">
                        <div style="display: flex; flex-direction: column; align-items: left; gap: 24px; overflow: visible; margin-left: 10px; margin-top: 12px">
                            <ul style="list-style-type: disc; padding-left: 2rem">
                                <template v-for="change in changelog">
                                    <h2 v-if="change.date" style="margin: 1rem; margin-left: -1rem; color: var(--accent);">{{ change.date }}</h2>
                                    <li v-if="change.action == 'a'" class="cl" style="margin: 0; font-family: 'Lexend Deca', sans-serif"><clw>{{ change.levelname }}</clw> has been placed at <clw>#{{ change.position }}</clw>, above <clw>{{ change.above }}</clw> and below <clw>{{ change.below }}</clw></li>
                                    <li v-if="change.action == 's'" class="cl" style="margin: 0; font-family: 'Lexend Deca', sans-serif"><clw>{{ change.levelname }}</clw> and <clw>{{ change.swapped }}</clw> have been swapped, with <clw>{{ change.levelname }}</clw> now sitting above at <clw>#{{ change.position }}</clw></li>
                                    <li v-if="change.action == 'm'" class="cl" style="margin: 0; font-family: 'Lexend Deca', sans-serif"><clw>{{ change.levelname }}</clw> has been raised from <clw>#{{ change.oldposition }}</clw> to <clw>#{{ change.position }}</clw>, above <clw>{{ change.above }}</clw> and below <clw>{{ change.below }}</clw></li>
                                    <li v-if="change.action == 'l'" class="cl" style="margin: 0; font-family: 'Lexend Deca', sans-serif"><clw>{{ change.levelname }}</clw> has been lowered from <clw>#{{ change.oldposition }}</clw> to <clw>#{{ change.position }}</clw>, above <clw>{{ change.above }}</clw> and below <clw>{{ change.below }}</clw></li>
                                    <li v-if="change.action == 'd'" class="cl" style="margin: 0; font-family: 'Lexend Deca', sans-serif"><clw>{{ change.levelname }}</clw> has been removed</li>
                                </template>
                            </ul>
                        </div>
                        <h3 style="text-align: center;" v-if="!changelog">Nothing here yet...</h3>  
                    </main>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>Error! (If this error doesn't go away after some time, please contact staff)</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">The Shitty List</a></p>
                        <br>
                        <p class="type-label-md">Certain features implemented by <a href="https://sgdlist.pages.dev/" target="_blank">The SGD List</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        <strong>level requirements:</strong>
                    </p>
                    <p>
                        levels MUST be controlled blue/green orb spam with an angle of 15 degrees or higher
                    </p>
                    <p>
                        if the level uses a nong please add that in your submission
                    </p>
                    <p>
                       no random triggers
                    </p>
                     <p>
                        levels must be possible in under 18 cps, do NOT use a loophole to get around this, use common sense to determine the rule's use
                    </p>
                    <p>
                        try not to use any art importer mods because they can break level id's
                    </p>
                    <p>
                        <strong>verification and record requirements:</strong>
                    </p>
                      <p>
                        levels must be verified legitimately
                    </p>
                     <p>
                        must have AUDIBLE clicks in a verification
                     </p>
                      <p>
                        if you verify a level with a secret way it will be placed using the secret way
                     </p>
                      <p>
                        must show the level endscreen
                     </p>
                      <p>
                         must have endscreen cheat indicator
                     </p>
                      <p>
                         must show previous attempt
                     </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: null,
        errors: [],
        searchQuery: '',
        showTimeMachine: false,
        showFilter: false,
        params: new URLSearchParams(document.location.search),
        gamemodeAsked: null,
        roleIconMap,
        store,
    }),
    computed: {
        level() {
            if (this.selected == null) {
                return 0;
            } else {
                return this.list[this.selected][0];
            }
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        originalListWithIndex() {
            return (this.list || []).map(([level, err], index) => ({
                level,
                err,
                originalIndex: index,
            }));
        },
        filteredListDisplay() {
            if (!this.searchQuery.trim()) {
                return this.originalListWithIndex;
            }
            const searchTerm = this.searchQuery.toLowerCase();
            return (this.originalListWithIndex || []).filter(item => item.level?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();
        this.changelog = await fetchChangelog();
        this.leDaily = await fetchdailylul();
        this.dates = await fetchDates();

        this.gamemodeAsked = this.params.get("gamemode");

        if (Math.floor(Math.random() * 100) == 12) {
            localStorage.setItem('purple', "true");
        }

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        getLevelThumbnail,
    },
};
