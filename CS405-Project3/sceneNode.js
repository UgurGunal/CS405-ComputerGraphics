/**
 * @class SceneNode
 * @desc A SceneNode is a node in the scene graph.
 * @property {MeshDrawer} meshDrawer - The MeshDrawer object to draw
 * @property {TRS} trs - The TRS object to transform the MeshDrawer
 * @property {SceneNode} parent - The parent node
 * @property {Array} children - The children nodes
 */

class SceneNode {
    constructor(meshDrawer, trs, parent = null) {
        this.meshDrawer = meshDrawer;
        this.trs = trs;
        this.parent = parent;
        this.children = [];

        if (parent) {
            this.parent.__addChild(this);
        }
    }

    __addChild(node) {
        this.children.push(node);
    }

    draw(mvp, modelView, normalMatrix, modelMatrix) {
        /**
         * @Task1 : Implement the draw function for the SceneNode class.
         */
        
         // Get the transformation matrix from TRS
         const trsMatrix = this.trs.getTransformationMatrix();
        
         // Transform the matrices by multiplying with the TRS matrix
         const transformedModel = MatrixMult(modelMatrix, trsMatrix);
         const transformedModelView = MatrixMult(modelView, trsMatrix);
         const transformedMvp = MatrixMult(mvp, trsMatrix);
         
         // Use the provided normalMatrix directly
         const transformedNormals = MatrixMult(normalMatrix, transpose(inverse(trsMatrix)));
 
         // Draw the current node's mesh if it exists
         if (this.meshDrawer) {
             this.meshDrawer.draw(transformedMvp, transformedModelView, transformedNormals, transformedModel);
         }
 
         // Recursively draw all children with the transformed matrices
         for (const child of this.children) {
             child.draw(
                 transformedMvp,
                 transformedModelView,
                 transformedNormals,
                 transformedModel
             );
         }
    }

    

}