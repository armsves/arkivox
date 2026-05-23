// SPDX-License-Identifier: MIT
// Reference patch for iExec-Nox/nox-protocol-contracts — NOT deployed by this app.
// Add to contracts/modules/ACL.sol so revoke maps to Nox removeViewer(bytes32,address).

pragma solidity ^0.8.35;

/*
    function removeViewer(
        bytes32 handle,
        address viewer
    ) external override notZeroAddress(viewer) notPublicHandle(handle) onlyAllowed(handle) {
        NoxComputeStorage storage $ = _getNoxComputeStorage();
        require($.viewers[handle][viewer], ViewerNotGranted(viewer, handle));
        delete $.viewers[handle][viewer];
        emit ViewerRemoved(msg.sender, viewer, handle);
    }
*/
