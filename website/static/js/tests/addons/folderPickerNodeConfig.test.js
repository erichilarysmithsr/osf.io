/*global describe, it, expect, example, before, after, beforeEach, afterEach, mocha, sinon*/
'use strict';
var assert = require('chai').assert;

var utils = require('tests/utils');
var faker = require('faker');

var oop = require('js/oop');
var ko = require('knockout');
var $ = require('jquery');
var $osf = require('osfHelpers');

var FolderPickerNodeConfigVM = require('js/folderPickerNodeConfig');

var onPickFolderSpy = new sinon.spy();
var resolveLazyloadUrlSpy = new sinon.spy();
var TestSubclassVM = oop.extend(FolderPickerNodeConfigVM, {
    constructor: function(addonName, url, selector, folderPicker) {
        this.super.constructor.call(this, addonName, url, selector, folderPicker);
        this.customField = ko.observable('');
    },
    _updateCustomFields: function(settings) {
        this.customField(settings.customField);
    },
    _serializeSettings: function(settings) {
        return this.folder().name.toUpperCase();
    }
});

var makeFakeData = function(overrides) {
    var nodeHasAuth = faker.random.number() ? true : false;
    var userHasAuth = faker.random.number() ? true : false;
    var userIsOwner = faker.random.number() ? true : false;
    var ownerName = faker.name.findName();
    var folder = {
        name: faker.hacker.noun(),
        id: faker.finance.account(),
        path: faker.hacker.noun()
    };
    var urlPath = faker.internet.domainWord();
    var url = faker.internet.ip();
    var urls = {};
    urls[urlPath] = url;
    var data = {
        nodeHasAuth: nodeHasAuth,
        userHasAuth: userHasAuth,
        userIsOwner: userIsOwner,
        folder: folder,
        ownerName: ownerName,
        urls: urls
    };
    return $.extend({}, data, overrides);
};


describe('FolderPickerNodeConfigViewModel', () => {
    var settingsUrl = '/api/v1/12345/addon/config/';
    var endpoints = [{
        method: 'GET',
        url: settingsUrl,
        response: {
            result: {
                ownerName: faker.name.findName(),
                userisOwner: true,
                userHasAuth: true,
                validCredentials: true,
                nodeHasAuth: true,
                urls: {
                    owner: '/abc123/',
                    config: settingsUrl
                }
            }
        }
    }];

    var server;
    before(() => {
        server = utils.createServer(sinon, endpoints);
    });

    after(() => {
        server.restore();
    });

    describe('ViewModel', () => {
        it('throws an Error if the return value of the Subclassess \'treebeardOptions\' method does not override the default \'resolveLazyloadUrl\'', () => {
            var broken = new TestSubclassVM('Fake Addon', settingsUrl, '#fakeAddonScope', '#fakeAddonPicker');
            assert.throw(broken.treebeardOptions().resolveLazyloadUrl, 'Subclassess of FolderPickerViewModel must implement an \'resolveLazyloadUrl(item)\' method');
        });
        it('throws an Error if the return value of the Subclassess \'treebeardOptions\' method does not override the default \'onPickFolder\'', () => {
            var broken = new TestSubclassVM('Fake Addon', settingsUrl, '#fakeAddonScope', '#fakeAddonPicker');
            assert.throw(broken.treebeardOptions().onPickFolder, 'Subclassess of FolderPickerViewModel must implement an \'onPickFolder(evt, item)\' method');
        });
        var vm = new TestSubclassVM('Fake Addon', settingsUrl, '#fakeAddonScope', '#fakeAddonPicker');
        var hardReset = () => {
            vm = new TestSubclassVM('Fake Addon', settingsUrl, '#fakeAddonScope', '#fakeAddonPicker');
        };
        describe('#showImport', () => {
            var reset = () => {
                vm.loadedSettings(true);
                vm.nodeHasAuth(false);
                vm.userHasAuth(true);
            };
            it('shows the import button when the User has auth, the Node doesn\'t have auth, and the VM has loaded settings', () => {
                reset();
                assert.isTrue(vm.showImport());
            });
            it('... and it doesn\'t show the import button otherwise', () => {
                reset();
                vm.loadedSettings(false);
                assert.isFalse(vm.showImport());
                reset();
                vm.nodeHasAuth(true);
                assert.isFalse(vm.showImport());
                reset();
                vm.userHasAuth(false);
                assert.isFalse(vm.showImport());
                reset();
                vm.loadedSettings(false);
                vm.nodeHasAuth(true);
                vm.userHasAuth(false);
                assert.isFalse(vm.showImport());
            });
        });
        describe('#showSettings', () => {
            var reset = () => {
                vm.nodeHasAuth(true);
            };
            it('shows settings if the Node has auth', () => {
                reset();
                assert.isTrue(vm.showSettings());
            });
            it('... and doesn\'t show settings otherwise', () => {
                reset();
                vm.nodeHasAuth(false);
                assert.isFalse(vm.showSettings());
            });
        });
        describe('#showTokenCreateButton', () => {
            var reset = () => {
                vm.userHasAuth(false);
                vm.nodeHasAuth(false);
                vm.loadedSettings(true);
            };
            it('shows the token create button if the User doesn\'t have auth, the Node doesn\'t have auth, and the VM has loaded settings', () => {
                reset();
                assert.isTrue(vm.showTokenCreateButton());
            });
            it('... and doesn\'t show the token create button otherwise', () => {
                reset();
                vm.userHasAuth(true);
                assert.isFalse(vm.showTokenCreateButton());
                reset();
                vm.nodeHasAuth(true);
                assert.isFalse(vm.showTokenCreateButton());
                reset();
                vm.loadedSettings(false);
                assert.isFalse(vm.showTokenCreateButton());
                reset();
                vm.userHasAuth(true);
                vm.nodeHasAuth(true);
                vm.loadedSettings(false);
                assert.isFalse(vm.showTokenCreateButton());
            });
        });
        describe('#folderName', () => {
            it('returns the value of the name property of the currently set folder when the Node has auth', () => {
                vm.nodeHasAuth(true);
                vm.folder({
                    name: null,
                    id: null
                });
                assert.isNull(vm.folderName());
                var name = faker.hacker.noun();
                vm.folder({
                    name: name,
                    id: faker.finance.account()
                });
                assert.equal(vm.folderName(), name);
            });
            it('... and returns an empty string otherwise', () => {
                vm.nodeHasAuth(false);
                assert.equal(vm.folderName(), '');
            });
        });
        describe('#selectedFolderName', () => {
            it('returns the selected folder\'s name if set else \'None\' when the User is owner', () => {
                vm.userIsOwner(true);
                vm.selected({
                    name: null,
                    id: null
                });
                assert.equal(vm.selectedFolderName(), 'None');
                var name = faker.hacker.noun();
                assert.notEqual(name, 'None');
                vm.selected({
                    name: name,
                    id: faker.finance.account()
                });
                assert.equal(vm.selectedFolderName(), name);
            });
            it('... and returns an empty string otherwise', () => {
                vm.userIsOwner(false);
                assert.equal(vm.selectedFolderName(), '');
            });
        });
        describe('#changeMessage', () => {
            var reset = () => {
                vm.message('');
                vm.messageClass('text-info');
            };
            it('updates the VM\'s message and message CSS class', () => {
                reset();
                vm.message('');
                vm.messageClass('text-info');
                var msg = 'Such success!';
                var cls = 'text-success';
                vm.changeMessage(msg, cls);
                assert.equal(vm.message(), msg);
                assert.equal(vm.messageClass(), cls);
                msg = 'Much fail!';
                cls = 'text-error';
                vm.changeMessage(msg, cls);
                assert.equal(vm.message(), msg);
                assert.equal(vm.messageClass(), cls);
            });
            var timer;
            before(() => {
                timer = sinon.useFakeTimers();
            });
            after(() => {
                timer.restore();
            });
            it('... and removes the message after a timeout if supplied', () => {
                reset();
                var oldMsg = vm.message();
                var oldCls = vm.messageClass();
                var msg = 'Such success!';
                var cls = 'text-success';
                vm.changeMessage(msg, cls, 200);
                timer.tick(201);
                assert.equal(vm.message(), oldMsg);
                assert.equal(vm.messageClass(), oldCls);
            });
        });
        describe('#updateFromData', () => {
            it('makes a call to fetchFromServer if no data passed as an argument', (done) => {
                var spy = sinon.spy(vm, 'fetchFromServer');
                vm.updateFromData()
                    .always(function() {
                        assert.isTrue(spy.calledOnce);
                        vm.fetchFromServer.restore();
                        done();
                    });
            });
            var data = makeFakeData();
            it('updates the VM with data if data passed as argument', (done) => {
                vm.updateFromData(data)
                    .always(function() {
                        assert.equal(vm.nodeHasAuth(), data.nodeHasAuth);
                        assert.equal(vm.userHasAuth(), data.userHasAuth);
                        assert.equal(vm.userIsOwner(), data.userIsOwner);
                        assert.deepEqual(vm.folder(), data.folder);
                        assert.equal(vm.ownerName(), data.ownerName);
                        assert.deepEqual(vm.urls(), data.urls);
                        done();
                    });
            });
            it('... and updates the custom fields requested in \'_updateCustomFields\'', (done) => {
                var customField = faker.hacker.noun();
                data.customField = customField;
                vm.updateFromData(data)
                    .always(function() {
                        assert.equal(vm.customField(), customField);
                        done();
                    });
            });
        });
        describe('#fetchFromServer', () => {
            var data = makeFakeData();
            var endpoints = [{
                method: 'GET',
                url: settingsUrl,
                response: {
                    result: data
                }
            }];
            var server;
            before(() => {
                server = utils.createServer(sinon, endpoints);
            });
            after(() => {
                server.restore();
            });
            it('makes GET request to the passed settings url returns a promise that resolves to the response', (done) => {
                vm.fetchFromServer()
                    .always(function(resp) {
                        assert.deepEqual(resp, data);
                        done();
                    });
            });
        });
        describe('#submitSettings', () => {
            var data = makeFakeData();
            data.urls.view = faker.internet.ip();
            var configUrl = faker.internet.ip();
            var endpoints = [{
                method: 'PUT',
                url: configUrl,
                response: {
                    result: data
                }
            }];
            var server;
            before(() => {
                server = utils.createServer(sinon, endpoints);
            });
            after(() => {
                server.restore();
            });
            data.urls.config = configUrl;
            it('serializes the VM state and sends a PUT request to the \'config\' url passed in settings', (done) => {
                hardReset();
                var spy = sinon.spy($osf, 'putJSON');
                vm.updateFromData(data)
                    .always(function() {
                        vm.submitSettings()
                            .always(function() {
                                assert.isTrue(
                                    spy.calledWith(data.urls.config, vm.folder().name.toUpperCase())
                                );
                                $osf.putJSON.restore();
                                done();
                            });
                    });
            });
        });
        describe('#_importAuthConfirm', () => {
            var importAuthUrl = faker.internet.ip();
            var endpoints = [{
                method: 'PUT',
                url: importAuthUrl,
                response: {}
            }];
            var server;
            before(() => {
                server = utils.createServer(sinon, endpoints);
            });
            after(() => {
                server.restore();
            });
            var data = makeFakeData();
            data.urls.importAuth = importAuthUrl;
            it('sends a PUT request to the \'importAuth\' url passed in settings, calls updateFromData with the response, and calls activatePicker', (done) => {
                assert.isTrue(false); // TODO
                hardReset();
                var spy = sinon.spy($osf, 'putJSON');
                vm.updateFromData(data)
                .always(function() {
                    vm._importAuthConfirm()
                        .always(function() {
                            assert.isTrue(
                                spy.calledWith(importAuthUrl, {})
                            );
                            $osf.putJSON.restore();
                            done();
                        });
                });
            });
        });
    });
});
