(function() {

    'use strict';

    angular
        .module('app.components')
        .controller('GridstackMovementController', GridstackMovementController)
        .component('gridstackWrapper', {
            templateUrl: 'app/components/gridstackWrapper/gridstack-wrapper.html',
            bindings: {
                list: '<',
                element: '@',
                cellHeight: '=',
                verticalMargin: '=',
                template: '@',
                callback: '&'
            },
            controller: 'GridstackMovementController',
            controllerAs: 'vm'
        });

    GridstackMovementController.$inject = ['$timeout', '$state', 'DecisionNotificationService', 'DecisionSharedService'];

    function GridstackMovementController($timeout, $state, DecisionNotificationService, DecisionSharedService) {
        var
            vm = this,
            gridItems = [],
            index,
            content = {
                decision: 'app/components/gridstackWrapper/decision-partial.html'
            },
            characteristicGroupNames = [];

        vm.displayList = [];
        vm.showPercentage = false;
        vm.gridStack = {};
        vm.innerTemplate = content[vm.template];
        vm.options = {
            cellHeight: vm.cellHeight,
            verticalMargin: vm.verticalMargin,
            draggable: {
                handle: '.panel-drag-handler',
            }
        };

        vm.selectDecision = selectDecision;
        vm.$onChanges = onChanges;
        vm.goToDecision = goToDecision;
        vm.getDetails = getDetails;
        vm.getGroupNameById = getGroupNameById;

        init();

        function getGroupNameById(id) {
            var group = _.find(characteristicGroupNames, function(group) {
                return group.characteristicGroupId.toString() === id;
            });
            return group ? group.name : 'Group';
        }

        function getDetails(decision) {
            if (!decision.characteristics && !decision.detailsSpinner) {
                DecisionNotificationService.notifyGetDetailedCharacteristics(decision);
            }
        }

        function goToDecision(event, decisionId) {
            event.stopPropagation();
            event.preventDefault();
            $state.go('decision', { id: decisionId });
        }

        function selectDecision(currentDecision) {
            var prevDecision = _.find(vm.initList, function(decision) {
                return decision.isSelected;
            });
            if (!prevDecision) {
                currentDecision.isSelected = true;
            } else if (prevDecision.decisionId === currentDecision.decisionId) {
                currentDecision.isSelected = false;
            } else {
                prevDecision.isSelected = false;
                currentDecision.isSelected = true;
            }
            vm.callback({ decision: currentDecision });
        }

        function onChanges() {
            gridItems = $('.' + vm.element);
            var plank, elIndex;
            if(vm.displayList.length === 0) {
                vm.displayList = angular.copy(vm.list);
            } else {
                _.forEach(vm.list, function(newItem, index) {
                    plank = _.find(gridItems, function(item) {
                        return newItem.decisionId === Number(item.getAttribute('id'));
                    });

                    if (plank) {
                        vm.gridStack.move(plank, 0, index);
                        newItem.reInit = true;
                        newItem.position = index;
                    }
                });
                $timeout(function() {
                    _.forEach(vm.list, function(newItem, i) {
                        if (!newItem.reInit) {
                            elIndex = _.findIndex(vm.displayList, function(item) {
                                return item.position === i;
                            });
                            newItem.position = i;
                            vm.displayList[elIndex] = newItem;
                        }
                    });    
                }, 0);
                
            }

            // //Move elements(decisions) in main column (animation)
            // gridItems = $('.' + vm.element);
            // _.forEach(gridItems, function(item) {
            //     index = vm.updateList.findIndex(function(data) {
            //         return data.decisionId === Number(item.getAttribute('id'));
            //     });
            //     if (index !== -1) {
            //         vm.gridStack.move(item, 0, index);
            //     }
            // });
            // //Add not existed decisions after moving(existing)
            // vm.initList = vm.updateList;

            //Show percent
            vm.showPercentage = DecisionSharedService.filterObject.selectedCriteria.sortCriteriaIds.length > 0;
        }

        function init() {
            DecisionNotificationService.subscribeCharacteristicsGroups(function(event, data) {
                characteristicGroupNames = data;
            });
            //Activate animation when gridstack object created
            $timeout(function() {
                vm.gridStack.setAnimation(true);
            }, 0);
        }
    }
})();
